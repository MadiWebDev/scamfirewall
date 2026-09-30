import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface TrendMetric {
  period: string;
  eventCount: number;
  byChannel: Record<string, number>;
  byScamType: Record<string, number>;
  byRiskLevel: Record<string, number>;
  interventionCount: number;
  escalationCount: number;
  recoveryStartedCount: number;
}

export interface InterventionEffectiveness {
  totalInterventions: number;
  feedbackReceived: number;
  helpfulCount: number;
  correctCount: number;
  byActionType: Record<string, { count: number; helpfulRate: number }>;
}

export interface RiskHotspot {
  channel: string;
  scamType: string;
  volume: number;
  avgRiskScore: number;
  trend: 'rising' | 'stable' | 'falling';
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getTrendMetrics(
    userId: string,
    days: number = 30,
  ): Promise<TrendMetric[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await this.prisma.scamEvent.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
        deletedAt: null,
      },
      include: {
        intervention: true,
        escalations: true,
        recovery: true,
      },
    });

    const byDay = new Map<string, TrendMetric>();

    for (const event of events) {
      const day = event.createdAt.toISOString().split('T')[0];
      const existing = byDay.get(day) || {
        period: day,
        eventCount: 0,
        byChannel: {},
        byScamType: {},
        byRiskLevel: {},
        interventionCount: 0,
        escalationCount: 0,
        recoveryStartedCount: 0,
      };

      existing.eventCount++;
      existing.byChannel[event.channel] = (existing.byChannel[event.channel] || 0) + 1;
      if (event.scamType) {
        existing.byScamType[event.scamType] = (existing.byScamType[event.scamType] || 0) + 1;
      }
      if (event.riskLevel) {
        existing.byRiskLevel[event.riskLevel] = (existing.byRiskLevel[event.riskLevel] || 0) + 1;
      }
      if (event.intervention) existing.interventionCount++;
      if (event.escalations.length > 0) existing.escalationCount++;
      if (event.recovery) existing.recoveryStartedCount++;

      byDay.set(day, existing);
    }

    return Array.from(byDay.values()).sort((a, b) => a.period.localeCompare(b.period));
  }

  async getInterventionEffectiveness(userId: string): Promise<InterventionEffectiveness> {
    const interventions = await this.prisma.intervention.findMany({
      where: {
        event: { userId },
      },
      include: {
        event: {
          include: {
            feedback: true,
          },
        },
      },
    });

    let helpfulCount = 0;
    let correctCount = 0;
    let feedbackReceived = 0;
    const byActionType: Record<string, { count: number; helpful: number; correct: number }> = {};

    for (const intervention of interventions) {
      const action = intervention.action;
      if (!byActionType[action]) {
        byActionType[action] = { count: 0, helpful: 0, correct: 0 };
      }
      byActionType[action].count++;

      if (intervention.event.feedback.length > 0) {
        feedbackReceived++;
        const feedback = intervention.event.feedback[0];
        if (feedback.helpful) {
          helpfulCount++;
          byActionType[action].helpful++;
        }
        if (feedback.correct) {
          correctCount++;
          byActionType[action].correct++;
        }
      }
    }

    const byActionTypeResult: Record<string, { count: number; helpfulRate: number }> = {};
    for (const [action, data] of Object.entries(byActionType)) {
      byActionTypeResult[action] = {
        count: data.count,
        helpfulRate: data.count > 0 ? data.helpful / data.count : 0,
      };
    }

    return {
      totalInterventions: interventions.length,
      feedbackReceived,
      helpfulCount,
      correctCount,
      byActionType: byActionTypeResult,
    };
  }

  async getRiskHotspots(userId: string, limit: number = 5): Promise<RiskHotspot[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const events = await this.prisma.scamEvent.findMany({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
        deletedAt: null,
      },
      include: {
        riskSignals: true,
      },
    });

    const hotspots = new Map<string, { volume: number; riskScores: number[]; timestamps: Date[] }>();

    for (const event of events) {
      const key = `${event.channel}:${event.scamType || 'UNKNOWN'}`;
      const existing = hotspots.get(key) || { volume: 0, riskScores: [], timestamps: [] };
      
      existing.volume++;
      
      const avgSignalWeight = event.riskSignals.length > 0
        ? event.riskSignals.reduce((sum, s) => sum + Math.abs(s.weight), 0) / event.riskSignals.length
        : 0;
      existing.riskScores.push(avgSignalWeight);
      existing.timestamps.push(event.createdAt);
      
      hotspots.set(key, existing);
    }

    const result: RiskHotspot[] = [];
    for (const [key, data] of hotspots.entries()) {
      const [channel, scamType] = key.split(':');
      const avgRiskScore = data.riskScores.reduce((a, b) => a + b, 0) / data.riskScores.length;
      
      // Determine trend
      const sorted = [...data.timestamps].sort((a, b) => a.getTime() - b.getTime());
      const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
      const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
      const firstCount = firstHalf.length;
      const secondCount = secondHalf.length;
      
      let trend: 'rising' | 'stable' | 'falling' = 'stable';
      if (secondCount > firstCount * 1.5) trend = 'rising';
      else if (firstCount > secondCount * 1.5) trend = 'falling';

      result.push({
        channel,
        scamType,
        volume: data.volume,
        avgRiskScore,
        trend,
      });
    }

    return result
      .sort((a, b) => b.volume * b.avgRiskScore - a.volume * a.avgRiskScore)
      .slice(0, limit);
  }

  async getEnterpriseMetrics(enterpriseId: string): Promise<{
    totalUsers: number;
    totalEvents: number;
    highRiskEvents: number;
    avgResponseTime: number;
    topScamTypes: Array<{ type: string; count: number }>;
  }> {
    const [totalUsers, totalEvents, highRiskEvents] = await Promise.all([
      this.prisma.user.count({ where: { enterpriseId } }),
      this.prisma.scamEvent.count({
        where: {
          user: { enterpriseId },
          deletedAt: null,
        },
      }),
      this.prisma.scamEvent.count({
        where: {
          user: { enterpriseId },
          riskLevel: { in: ['HIGH', 'CRITICAL'] },
          deletedAt: null,
        },
      }),
    ]);

    const eventsByType = await this.prisma.scamEvent.groupBy({
      by: ['scamType'],
      where: {
        user: { enterpriseId },
        deletedAt: null,
      },
      _count: { scamType: true },
    });

    const topScamTypes = eventsByType
      .filter(e => e.scamType !== null)
      .map(e => ({ type: e.scamType!, count: e._count.scamType }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalUsers,
      totalEvents,
      highRiskEvents,
      avgResponseTime: 0, // Placeholder for future metric
      topScamTypes,
    };
  }
}
