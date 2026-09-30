// src/modules/escalation/escalation.controller.ts
import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EscalationService } from './escalation.service';

@UseGuards(JwtAuthGuard)
@Controller('events/:eventId/escalate')
export class EscalationController {
  constructor(private svc: EscalationService) {}
  @Post() trigger(@CurrentUser() u: any, @Param('eventId') id: string, @Body() body: { trustedContactId?: string }) {
    return this.svc.trigger(u.sub, id, body?.trustedContactId);
  }
}