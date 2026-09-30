// src/modules/scam-events/scam-events.controller.ts
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ScamEventsService } from './scam-events.service';
import { FeedbackDto, SubmitEventDto } from './dto/submit-event.dto';

@ApiTags('events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('events')
export class ScamEventsController {
  constructor(private events: ScamEventsService) {}

  @Post() submit(@CurrentUser() u: { sub: string }, @Body() dto: SubmitEventDto) {
    return this.events.submit(u.sub, dto);
  }

  @Get() list(@CurrentUser() u: { sub: string }) { return this.events.list(u.sub); }

  @Get(':id') find(@CurrentUser() u: { sub: string }, @Param('id') id: string) {
    return this.events.findById(u.sub, id);
  }

  @Post(':id/feedback') feedback(
    @CurrentUser() u: { sub: string },
    @Param('id') id: string,
    @Body() dto: FeedbackDto,
  ) { return this.events.submitFeedback(u.sub, id, dto.helpful, dto.correct, dto.notes); }
}