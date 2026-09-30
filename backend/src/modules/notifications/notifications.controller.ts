import { Controller, Get, Post, Param, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Request() req,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.getNotificationHistory(
      req.user.userId,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get('unread')
  async getUnread(@Request() req) {
    return this.notificationsService.getUnreadNotifications(req.user.userId);
  }

  @Post(':id/read')
  async markAsRead(@Request() req, @Param('id') id: string) {
    await this.notificationsService.markAsRead(req.user.userId, id);
    return { success: true };
  }
}
