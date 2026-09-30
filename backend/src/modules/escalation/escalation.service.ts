// src/modules/escalation/escalation.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EscalationService {
  constructor(private prisma: PrismaService) {}
  async trigger(userId: string, eventId: string, trustedContactId?: string) {
    const event = await this.prisma.scamEvent.findFirst({ where: { id: eventId, userId } });
    if (!event) throw new NotFoundException();
    const tc = trustedContactId
      ? await this.prisma.trustedContact.findFirst({ where: { id: trustedContactId, ownerUserId: userId } })
      : await this.prisma.trustedContact.findFirst({ where: { ownerUserId: userId }, orderBy: { priority: 'asc' } });

    const esc = await this.prisma.escalation.create({
      data: {
        eventId, trustedContactId: tc?.id, channel: tc?.channelPref ?? 'sms',
        reason: 'High-risk event escalation',
      },
    });
    await this.prisma.incidentTimelineEntry.create({
      data: { eventId, kind: 'escalated', message: `Escalated to ${tc?.displayName ?? 'no contact'}` },
    });
    return esc;
  }
}