import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface UserPolicySettings {
  sensitivity: 'gentle' | 'balanced' | 'strict';
  channelsEnabled: {
    call: boolean;
    sms: boolean;
    email: boolean;
    messaging: boolean;
    link: boolean;
    qr: boolean;
    invoice: boolean;
    payment: boolean;
  };
  trustedEscalation: boolean;
  highRiskActionLock: boolean;
  elderMode: boolean;
  autoEscalateCritical: boolean;
  retentionDays: number;
}

const DEFAULT_POLICY: UserPolicySettings = {
  sensitivity: 'balanced',
  channelsEnabled: {
    call: true,
    sms: true,
    email: true,
    messaging: true,
    link: true,
    qr: true,
    invoice: true,
    payment: true,
  },
  trustedEscalation: true,
  highRiskActionLock: true,
  elderMode: false,
  autoEscalateCritical: false,
  retentionDays: 90,
};

@Injectable()
export class PolicyService {
  constructor(private prisma: PrismaService) {}

  async getUserPolicy(userId: string): Promise<UserPolicySettings> {
    const rules = await this.prisma.policyRule.findMany({
      where: { scope: 'user', scopeId: userId },
    });

    const settings = { ...DEFAULT_POLICY };

    for (const rule of rules) {
      switch (rule.key) {
        case 'sensitivity':
          settings.sensitivity = rule.value as UserPolicySettings['sensitivity'];
          break;
        case 'channelsEnabled':
          settings.channelsEnabled = { ...settings.channelsEnabled, ...rule.value };
          break;
        case 'trustedEscalation':
          settings.trustedEscalation = rule.value as boolean;
          break;
        case 'highRiskActionLock':
          settings.highRiskActionLock = rule.value as boolean;
          break;
        case 'elderMode':
          settings.elderMode = rule.value as boolean;
          break;
        case 'autoEscalateCritical':
          settings.autoEscalateCritical = rule.value as boolean;
          break;
        case 'retentionDays':
          settings.retentionDays = rule.value as number;
          break;
      }
    }

    // Also check user profile for elderMode
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { elderMode: true },
    });

    if (user?.elderMode) {
      settings.elderMode = true;
    }

    return settings;
  }

  async updateUserPolicy(
    userId: string,
    updates: Partial<UserPolicySettings>,
  ): Promise<UserPolicySettings> {
    const keys = Object.keys(updates) as Array<keyof UserPolicySettings>;

    for (const key of keys) {
      const value = updates[key];
      await this.prisma.policyRule.upsert({
        where: {
          scope_scopeId_key: {
            scope: 'user',
            scopeId: userId,
            key,
          },
        },
        update: { value: value as object },
        create: {
          scope: 'user',
          scopeId: userId,
          key,
          value: value as object,
        },
      });
    }

    return this.getUserPolicy(userId);
  }

  async getFamilyPolicy(familyId: string): Promise<Partial<UserPolicySettings>> {
    const rules = await this.prisma.policyRule.findMany({
      where: { scope: 'family', scopeId: familyId },
    });

    const settings: Partial<UserPolicySettings> = {};

    for (const rule of rules) {
      (settings as Record<string, unknown>)[rule.key] = rule.value;
    }

    return settings;
  }

  async updateFamilyPolicy(
    familyId: string,
    updates: Partial<UserPolicySettings>,
  ): Promise<Partial<UserPolicySettings>> {
    const keys = Object.keys(updates) as Array<keyof UserPolicySettings>;

    for (const key of keys) {
      const value = updates[key];
      await this.prisma.policyRule.upsert({
        where: {
          scope_scopeId_key: {
            scope: 'family',
            scopeId: familyId,
            key,
          },
        },
        update: { value: value as object },
        create: {
          scope: 'family',
          scopeId: familyId,
          key,
          value: value as object,
        },
      });
    }

    return this.getFamilyPolicy(familyId);
  }

  async getEnterprisePolicy(enterpriseId: string): Promise<Record<string, unknown>> {
    const config = await this.prisma.enterpriseConfig.findMany({
      where: { enterpriseId },
    });

    return config.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {} as Record<string, unknown>);
  }

  async isChannelEnabled(userId: string, channel: string): Promise<boolean> {
    const policy = await this.getUserPolicy(userId);
    return policy.channelsEnabled[channel as keyof typeof policy.channelsEnabled] ?? true;
  }

  async shouldEscalate(userId: string, riskLevel: string): Promise<boolean> {
    const policy = await this.getUserPolicy(userId);
    
    if (riskLevel === 'CRITICAL' && policy.autoEscalateCritical) {
      return true;
    }
    
    return policy.trustedEscalation && (riskLevel === 'HIGH' || riskLevel === 'CRITICAL');
  }
}
