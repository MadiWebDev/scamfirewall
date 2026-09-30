// src/modules/scam-events/scam-events.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { SignalAnalysisService } from '../signal-analysis/signal-analysis.service';
import { InterventionService } from '../intervention/intervention.service';
import { SubmitEventDto } from './dto/submit-event.dto';
import { EventChannel } from '@prisma/client';

@Injectable()
export class ScamEventsService {
  constructor(
    private prisma: PrismaService,
    private signals: SignalAnalysisService,
    private interventions: InterventionService,
  ) {}

  async submit(userId: string, dto: SubmitEventDto) {
    const rawInputHash = this.hash(JSON.stringify({ ...dto, userId }));

    const event = await this.prisma.scamEvent.create({
      data: {
        userId,
        channel: dto.channel,
        rawInputHash,
        redactedSummary: this.redact(dto.text),
        status: 'ANALYZING',
        artifacts: {
          create: [
            ...(dto.text ? [{ kind: 'text', metadata: { length: dto.text.length } }] : []),
            ...(dto.url  ? [{ kind: 'url',  metadata: { url: dto.url } }] : []),
            ...(dto.callerId ? [{ kind: 'call_meta', metadata: { callerId: dto.callerId } }] : []),
            ...(dto.invoice ? [{ kind: 'invoice', metadata: dto.invoice as any }] : []),
          ],
        },
        timeline: { create: [{ kind: 'created', message: 'Event submitted' }] },
      },
    });

    const detected = await this.signals.analyze({
      channel: dto.channel,
      text: dto.text,
      url: dto.url,
      callerId: dto.callerId,
      invoice: dto.invoice,
    });

    if (detected.length) {
      await this.prisma.riskSignal.createMany({
        data: detected.map(s => ({ eventId: event.id, ...s })),
      });
    }

    const result = this.interventions.buildIntervention(detected, dto.channel);

    const intervention = await this.prisma.intervention.create({
      data: {
        eventId: event.id,
        action: result.action,
        riskLevel: result.riskLevel,
        scamType: result.scamType,
        headline: result.headline,
        reasons: result.reasons,
        doNotDo: result.doNotDo,
        safestNext: result.safestNext,
        verifyVia: result.verifyVia,
        uncertainty: result.uncertainty,
        scoringVersion: result.scoringVersion,
      },
    });

    await this.prisma.scamEvent.update({
      where: { id: event.id },
      data: {
        status: 'ANALYZED',
        riskLevel: result.riskLevel,
        scamType: result.scamType,
        timeline: { create: [{ kind: 'analyzed', message: `Risk: ${result.riskLevel}, Type: ${result.scamType}` }] },
      },
    });

    if (result.riskLevel === 'CRITICAL' || result.riskLevel === 'HIGH') {
      await this.prisma.scamEvent.update({
        where: { id: event.id },
        data: { timeline: { create: [{ kind: 'warning_shown', message: result.headline }] } },
      });
    }

    return this.findById(userId, event.id);
  }

  async list(userId: string, take = 50) {
    return this.prisma.scamEvent.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take,
      include: { intervention: true },
    });
  }

  async findById(userId: string, id: string) {
    const event = await this.prisma.scamEvent.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        artifacts: true,
        riskSignals: { orderBy: { weight: 'desc' } },
        intervention: { include: { verificationSteps: true } },
        escalations: true,
        recovery: { include: { tasks: { orderBy: { order: 'asc' } } } },
        timeline: { orderBy: { createdAt: 'asc' } },
        feedback: true,
      },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async submitFeedback(userId: string, eventId: string, helpful: boolean, correct?: boolean, notes?: string) {
    await this.findById(userId, eventId);
    return this.prisma.eventFeedback.create({ data: { eventId, helpful, correct, notes } });
  }

  private hash(s: string) { return createHash('sha256').update(s).digest('hex'); }

  private redact(text?: string) {
    if (!text) return null;
    return text
      .replace(/\b\d{13,19}\b/g, '[CARD]')
      .replace(/\b\d{3,4}\b(?=\s*(?:cvv|cvc))/gi, '[CVV]')
      .replace(/\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/g, '[IBAN]')
      .replace(/\b\d{6,8}\b/g, '[OTP]')
      .slice(0, 240);
  }
}