import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PolicyService, UserPolicySettings } from './policy.service';

class UpdatePolicyDto implements Partial<UserPolicySettings> {
  sensitivity?: 'gentle' | 'balanced' | 'strict';
  channelsEnabled?: {
    call: boolean;
    sms: boolean;
    email: boolean;
    messaging: boolean;
    link: boolean;
    qr: boolean;
    invoice: boolean;
    payment: boolean;
  };
  trustedEscalation?: boolean;
  highRiskActionLock?: boolean;
  elderMode?: boolean;
  autoEscalateCritical?: boolean;
  retentionDays?: number;
}

@Controller('policy')
@UseGuards(JwtAuthGuard)
export class PolicyController {
  constructor(private policyService: PolicyService) {}

  @Get()
  async getPolicy(@Request() req) {
    return this.policyService.getUserPolicy(req.user.userId);
  }

  @Put()
  async updatePolicy(@Request() req, @Body() updates: UpdatePolicyDto) {
    return this.policyService.updateUserPolicy(req.user.userId, updates);
  }

  @Get('family/:familyId')
  async getFamilyPolicy(@Request() req, familyId: string) {
    // TODO: Verify user is family owner
    return this.policyService.getFamilyPolicy(familyId);
  }
}
