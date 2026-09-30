import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface EnterpriseDashboardData {
  enterprise: {
    id: string;
    name: string;
    slug: string;
  };
  metrics: {
    totalUsers: number;
    activeUsers: number;
    totalEvents: number;
    highRiskEvents: number;
    escalationsTriggered: number;
    avgResponseTime: number;
  };
  topScamTypes: Array<{ type: string; count: number; trend: 'up' | 'down' | 'stable' }>;
  recentEvents: Array<{
    id: string;
    channel: string;
    riskLevel: string;
    scamType: string;
    createdAt: Date;
    userEmail: string;
  }>;
  reviewQueue: {
    total: number;
    pending: number;
    reviewing: number;
  };
}

@Injectable()
export class EnterpriseService {
  constructor(private prisma: PrismaService) {}

  async getEnterpriseById(id: string) {
    return this.prisma.enterpriseAccount.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, email: true, fullName: true, role: true, createdAt: true },
        },
        configs: true,
      },
    });
  }

  async getEnterpriseBySlug(slug: string) {
    return this.prisma.enterpriseAccount.findUnique({
      where: { slug },
      include: {
        users: {
          select: { id: true, email: true, fullName: true, role: true },
        },
        configs: true,
      },
    });
  }

  async getDashboardData(enterpriseId: string): Promise<EnterpriseDashboardData> {
    const enterprise = await this.prisma.enterpriseAccount.findUnique({
      where: { id: enterpriseId },
    });

    if (!enterprise) {
      throw new Error('Enterprise not found');
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      activeUsers,
      totalEvents,
      highRiskEvents,
      escalationsCount,
      reviewQueueStats,
      recentEvents,
      topScamTypes,
    ] = await Promise.all([
      this.prisma.user.count({ where: { enterpriseId } }),
      this.prisma.user.count({
        where: {
          enterpriseId,
          scamEvents: { some: { createdAt: { gte: thirtyDaysAgo } } },
        },
      }),
      this.prisma.scamEvent.count({
        where: { user: { enterpriseId }, deletedAt: null },
      }),
      this.prisma.scamEvent.count({
        where: {
          user: { enterpriseId },
          riskLevel: { in: ['HIGH', 'CRITICAL'] },
          deletedAt: null,
        },
      }),
      this.prisma.escalation.count({
        where: { event: { user: { enterpriseId } } },
      }),
      this.prisma.analystReviewItem.groupBy({
        by: ['status'],
        where: { event: { user: { enterpriseId } } },
        _count: { status: true },
      }),
      this.prisma.scamEvent.findMany({
        where: { user: { enterpriseId }, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: { select: { email: true } },
        },
      }),
      this.prisma.scamEvent.groupBy({
        by: ['scamType'],
        where: {
          user: { enterpriseId },
          scamType: { not: null },
          deletedAt: null,
          createdAt: { gte: thirtyDaysAgo },
        },
        _count: { scamType: true },
      }),
    ]);

    const reviewQueue = {
      total: reviewQueueStats.reduce((sum, s) => sum + s._count.status, 0),
      pending: reviewQueueStats.find(s => s.status === 'queued')?._count.status || 0,
      reviewing: reviewQueueStats.find(s => s.status === 'reviewing')?._count.status || 0,
    };

    return {
      enterprise: {
        id: enterprise.id,
        name: enterprise.name,
        slug: enterprise.slug,
      },
      metrics: {
        totalUsers,
        activeUsers,
        totalEvents,
        highRiskEvents,
        escalationsTriggered: escalationsCount,
        avgResponseTime: 0, // Placeholder
      },
      topScamTypes: topScamTypes
        .sort((a, b) => b._count.scamType - a._count.scamType)
        .slice(0, 5)
        .map(t => ({
          type: t.scamType!,
          count: t._count.scamType,
          trend: 'stable' as const,
        })),
      recentEvents: recentEvents.map(e => ({
        id: e.id,
        channel: e.channel,
        riskLevel: e.riskLevel || 'UNKNOWN',
        scamType: e.scamType || 'UNKNOWN',
        createdAt: e.createdAt,
        userEmail: e.user.email,
      })),
      reviewQueue,
    };
  }

  async getReviewQueue(enterpriseId: string, status?: string) {
    return this.prisma.analystReviewItem.findMany({
      where: {
        event: { user: { enterpriseId } },
        ...(status && { status }),
      },
      include: {
        event: {
          include: {
            user: { select: { email: true, fullName: true } },
            intervention: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateReviewItem(
    reviewItemId: string,
    updates: { status: string; reviewer: string; notes?: string },
  ) {
    return this.prisma.analystReviewItem.update({
      where: { id: reviewItemId },
      data: {
        status: updates.status,
        reviewer: updates.reviewer,
        notes: updates.notes,
      },
    });
  }

  async createEnterprise(data: { name: string; slug: string; industry?: string }) {
    return this.prisma.enterpriseAccount.create({
      data: {
        name: data.name,
        slug: data.slug,
        industry: data.industry,
      },
    });
  }

  async updateEnterpriseConfig(
    enterpriseId: string,
    key: string,
    value: object,
  ) {
    return this.prisma.enterpriseConfig.upsert({
      where: {
        enterpriseId_key: {
          enterpriseId,
          key,
        },
      },
      update: { value },
      create: {
        enterpriseId,
        key,
        value,
      },
    });
  }
}
