import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditEvent } from '@prisma/client';

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  target?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    userId?: string;
    actor: string;
    action: string;
    target?: string;
    metadata?: Record<string, unknown>;
  }): Promise<AuditEvent> {
    return this.prisma.auditEvent.create({
      data: {
        userId: params.userId,
        actor: params.actor,
        action: params.action,
        target: params.target,
        metadata: params.metadata || {},
      },
    });
  }

  async getAuditLog(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      action?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<{ entries: AuditEvent[]; total: number }> {
    const where = {
      userId,
      ...(options?.action && { action: options.action }),
      ...(options?.startDate && { createdAt: { gte: options.startDate } }),
      ...(options?.endDate && { createdAt: { lte: options.endDate } }),
    };

    const [entries, total] = await Promise.all([
      this.prisma.auditEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      this.prisma.auditEvent.count({ where }),
    ]);

    return { entries, total };
  }

  async getEnterpriseAuditLog(
    enterpriseId: string,
    options?: {
      limit?: number;
      offset?: number;
      action?: string;
    },
  ): Promise<{ entries: AuditEvent[]; total: number }> {
    const where = {
      user: { enterpriseId },
      ...(options?.action && { action: options.action }),
    };

    const [entries, total] = await Promise.all([
      this.prisma.auditEvent.findMany({
        where,
        include: { user: { select: { email: true, fullName: true } } },
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      this.prisma.auditEvent.count({ where }),
    ]);

    return { entries, total };
  }

  async logEventCreated(userId: string, eventId: string, channel: string): Promise<void> {
    await this.log({
      userId,
      actor: userId,
      action: 'scam_event.created',
      target: eventId,
      metadata: { channel },
    });
  }

  async logInterventionShown(userId: string, eventId: string, interventionId: string): Promise<void> {
    await this.log({
      userId,
      actor: 'system',
      action: 'intervention.shown',
      target: interventionId,
      metadata: { eventId },
    });
  }

  async logEscalationTriggered(userId: string, eventId: string, escalationId: string): Promise<void> {
    await this.log({
      userId,
      actor: userId,
      action: 'escalation.triggered',
      target: escalationId,
      metadata: { eventId },
    });
  }

  async logRecoveryStarted(userId: string, eventId: string, checklistId: string): Promise<void> {
    await this.log({
      userId,
      actor: userId,
      action: 'recovery.started',
      target: checklistId,
      metadata: { eventId },
    });
  }

  async logSettingsChanged(userId: string, changes: Record<string, { old: unknown; new: unknown }>): Promise<void> {
    await this.log({
      userId,
      actor: userId,
      action: 'settings.changed',
      metadata: { changes },
    });
  }

  async logConsentGiven(userId: string, scope: string, granted: boolean): Promise<void> {
    await this.log({
      userId,
      actor: userId,
      action: granted ? 'consent.granted' : 'consent.revoked',
      metadata: { scope },
    });
  }

  async logDataExport(userId: string, exportId: string, formats: string[]): Promise<void> {
    await this.log({
      userId,
      actor: userId,
      action: 'data.exported',
      target: exportId,
      metadata: { formats },
    });
  }

  async logDataDeletion(userId: string, deletionId: string, scope: string): Promise<void> {
    await this.log({
      userId,
      actor: userId,
      action: 'data.deletion.requested',
      target: deletionId,
      metadata: { scope },
    });
  }
}
