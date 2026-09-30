import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditService } from './audit.service';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get('log')
  async getAuditLog(
    @Request() req,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('action') action?: string,
  ) {
    return this.auditService.getAuditLog(req.user.userId, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      action,
    });
  }

  @Get('enterprise')
  async getEnterpriseAuditLog(
    @Request() req,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('action') action?: string,
  ) {
    if (!req.user.enterpriseId) {
      return { error: 'No enterprise associated' };
    }
    return this.auditService.getEnterpriseAuditLog(req.user.enterpriseId, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      action,
    });
  }
}
