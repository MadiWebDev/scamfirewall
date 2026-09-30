// src/modules/recovery/recovery.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ScamType } from '@prisma/client';

const TEMPLATES: Record<ScamType, { title: string; detail: string; category: string }[]> = {
  BANK_IMPERSONATION: [
    { title: 'Call your bank using the number on your card', detail: 'Report a possible impersonation contact.', category: 'bank' },
    { title: 'Freeze cards if any details were shared', detail: 'Use your banking app or call support.', category: 'bank' },
    { title: 'Change online banking password', detail: 'Choose a unique password not used elsewhere.', category: 'password' },
    { title: 'Enable 2FA on banking', detail: 'Prefer app-based 2FA over SMS.', category: 'password' },
    { title: 'Save a screenshot of the message/call', detail: 'Evidence helps your bank investigate.', category: 'evidence' },
  ],
  PAYMENT_DIVERSION: [
    { title: 'Contact your bank within minutes', detail: 'Some transfers can be recalled within hours.', category: 'bank' },
    { title: 'Call the real recipient', detail: 'Verify their actual payment details using a known number.', category: 'evidence' },
    { title: 'File a report with local fraud authorities', detail: 'Use the official reporting site for your country.', category: 'report' },
  ],
  CRYPTO_TRANSFER: [
    { title: 'Stop any in-flight transfers', detail: 'Crypto transfers cannot be reversed once confirmed.', category: 'bank' },
    { title: 'Save the wallet address and tx hash', detail: 'Required for any report.', category: 'evidence' },
    { title: 'Report to your exchange', detail: 'They may flag the destination address.', category: 'report' },
  ],
  KYC_PHISHING: [
    { title: 'Reset passwords for the impersonated service', detail: 'Start with email, then financial accounts.', category: 'password' },
    { title: 'Run a device security check', detail: 'Update OS and remove suspicious apps.', category: 'device' },
    { title: 'Enable 2FA everywhere', detail: 'Authenticator app preferred.', category: 'password' },
  ],
  GOVERNMENT_IMPERSONATION: [
    { title: 'Verify via official government website', detail: 'Type the URL manually.', category: 'evidence' },
    { title: 'Report the impersonation', detail: 'Most agencies have a reporting page.', category: 'report' },
  ],
  TECH_SUPPORT: [
    { title: 'Disconnect remote-access software', detail: 'Uninstall AnyDesk/TeamViewer if installed.', category: 'device' },
    { title: 'Run a malware scan', detail: 'Use a trusted vendor.', category: 'device' },
  ],
  PARCEL_DELIVERY: [{ title: 'Track via official courier site', detail: 'Type the URL manually.', category: 'evidence' }],
  ROMANCE: [{ title: 'Stop sending money or gifts', detail: 'Talk to a trusted person before sending more.', category: 'evidence' }],
  INVESTMENT: [{ title: 'Stop further transfers', detail: 'High-yield promises are a red flag.', category: 'evidence' }],
  OTP_HARVESTING: [{ title: 'Reset account password and 2FA', detail: 'Then revoke active sessions.', category: 'password' }],
  FAKE_INVOICE: [{ title: 'Verify the invoice with the real vendor', detail: 'Use a known phone number.', category: 'evidence' }],
  REMOTE_ACCESS: [{ title: 'Uninstall remote-access apps', detail: 'AnyDesk, TeamViewer, etc.', category: 'device' }],
  UNKNOWN: [{ title: 'Document what happened', detail: 'Keep screenshots and timestamps.', category: 'evidence' }],
};

@Injectable()
export class RecoveryService {
  constructor(private prisma: PrismaService) {}

  async start(userId: string, eventId: string) {
    const event = await this.prisma.scamEvent.findFirst({ where: { id: eventId, userId } });
    if (!event) throw new NotFoundException();
    const scamType = event.scamType ?? 'UNKNOWN';
    const tasks = TEMPLATES[scamType];

    return this.prisma.recoveryChecklist.upsert({
      where: { eventId },
      create: {
        eventId, scamType,
        tasks: { create: tasks.map((t, i) => ({ order: i, ...t })) },
      },
      update: {},
      include: { tasks: { orderBy: { order: 'asc' } } },
    });
  }

  async completeTask(userId: string, eventId: string, taskId: string) {
    const event = await this.prisma.scamEvent.findFirst({ where: { id: eventId, userId } });
    if (!event) throw new NotFoundException();
    return this.prisma.recoveryTask.update({
      where: { id: taskId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  }
}   