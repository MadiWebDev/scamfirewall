import { Controller, Get, Put, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EnterpriseService } from './enterprise.service';

@Controller('enterprise')
@UseGuards(JwtAuthGuard)
export class EnterpriseController {
  constructor(private enterpriseService: EnterpriseService) {}

  @Get('dashboard')
  async getDashboard(@Request() req) {
    if (!req.user.enterpriseId) {
      return { error: 'No enterprise associated' };
    }
    return this.enterpriseService.getDashboardData(req.user.enterpriseId);
  }

  @Get('review-queue')
  async getReviewQueue(
    @Request() req,
    @Query('status') status?: string,
  ) {
    if (!req.user.enterpriseId) {
      return { error: 'No enterprise associated' };
    }
    return this.enterpriseService.getReviewQueue(req.user.enterpriseId, status);
  }

  @Put('review-queue/:id')
  async updateReviewItem(
    @Param('id') id: string,
    @Body() updates: { status: string; notes?: string },
    @Request() req,
  ) {
    return this.enterpriseService.updateReviewItem(id, {
      ...updates,
      reviewer: req.user.userId,
    });
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.enterpriseService.getEnterpriseBySlug(slug);
  }

  @Post()
  async create(
    @Body() data: { name: string; slug: string; industry?: string },
  ) {
    return this.enterpriseService.createEnterprise(data);
  }

  @Put(':id/config/:key')
  async updateConfig(
    @Param('id') enterpriseId: string,
    @Param('key') key: string,
    @Body() value: object,
  ) {
    return this.enterpriseService.updateEnterpriseConfig(enterpriseId, key, value);
  }
}
