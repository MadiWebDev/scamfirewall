import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('trends')
  async getTrends(
    @Request() req,
    @Query('days') days?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.analyticsService.getTrendMetrics(req.user.userId, daysNum);
  }

  @Get('effectiveness')
  async getEffectiveness(@Request() req) {
    return this.analyticsService.getInterventionEffectiveness(req.user.userId);
  }

  @Get('hotspots')
  async getHotspots(
    @Request() req,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 5;
    return this.analyticsService.getRiskHotspots(req.user.userId, limitNum);
  }

  @Get('enterprise')
  async getEnterpriseMetrics(@Request() req) {
    if (!req.user.enterpriseId) {
      return { error: 'No enterprise associated' };
    }
    return this.analyticsService.getEnterpriseMetrics(req.user.enterpriseId);
  }
}
