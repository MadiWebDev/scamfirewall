import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async queueNotification(
    userId: string,
    channel: 'in_app' | 'push' | 'sms' | 'email',
    payload: NotificationPayload,
  ): Promise<string> {
    const notification = await this.prisma.notificationEvent.create({
      data: {
        userId,
        channel,
        title: payload.title,
        body: payload.body,
        payload: payload.data || {},
      },
    });
    return notification.id;
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await this.prisma.notificationEvent.update({
      where: { id: notificationId, userId },
      data: { readAt: new Date() },
    });
  }

  async getUnreadNotifications(userId: string) {
    return this.prisma.notificationEvent.findMany({
      where: {
        userId,
        readAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getNotificationHistory(userId: string, limit: number = 50) {
    return this.prisma.notificationEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async sendEscalationAlert(
    contactUserId: string,
    protectedUserName: string,
    eventId: string,
    riskLevel: string,
  ): Promise<void> {
    await this.queueNotification(contactUserId, 'push', {
      title: 'Scam Firewall Alert',
      body: `${protectedUserName} may be facing a ${riskLevel.toLowerCase()} risk scam. Please check on them.`,
      data: { type: 'escalation', eventId, riskLevel },
    });
  }

  async sendInterventionNotification(
    userId: string,
    eventId: string,
    headline: string,
  ): Promise<void> {
    await this.queueNotification(userId, 'in_app', {
      title: 'Security Warning',
      body: headline,
      data: { type: 'intervention', eventId },
    });
  }

  async sendRecoveryReminder(
    userId: string,
    checklistId: string,
    pendingTasks: number,
  ): Promise<void> {
    await this.queueNotification(userId, 'in_app', {
      title: 'Recovery Checklist',
      body: `You have ${pendingTasks} pending recovery tasks. Complete them to secure your accounts.`,
      data: { type: 'recovery', checklistId, pendingTasks },
    });
  }

  // Placeholder for push notification provider integration
  async sendPushNotification(deviceToken: string, payload: NotificationPayload): Promise<void> {
    // TODO: Integrate with Firebase Cloud Messaging, OneSignal, or similar
    console.log(`[PUSH PLACEHOLDER] To: ${deviceToken}, Title: ${payload.title}`);
  }

  // Placeholder for SMS provider integration
  async sendSMS(phoneNumber: string, message: string): Promise<void> {
    // TODO: Integrate with Twilio, AWS SNS, or similar
    console.log(`[SMS PLACEHOLDER] To: ${phoneNumber}, Message: ${message}`);
  }

  // Placeholder for email provider integration
  async sendEmail(email: string, subject: string, html: string): Promise<void> {
    // TODO: Integrate with SendGrid, AWS SES, or similar
    console.log(`[EMAIL PLACEHOLDER] To: ${email}, Subject: ${subject}`);
  }
}
