// src/modules/recovery/recovery.controller.ts
import { Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RecoveryService } from './recovery.service';

@UseGuards(JwtAuthGuard)
@Controller('events/:eventId/recovery')
export class RecoveryController {
  constructor(private recovery: RecoveryService) {}
  @Post() start(@CurrentUser() u: any, @Param('eventId') id: string) { return this.recovery.start(u.sub, id); }
  @Patch('tasks/:taskId/complete') complete(@CurrentUser() u: any, @Param('eventId') id: string, @Param('taskId') t: string) {
    return this.recovery.completeTask(u.sub, id, t);
  }
}