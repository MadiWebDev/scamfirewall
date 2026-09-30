// src/modules/users/users.controller.ts
import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

class UpdateProfileDto {
  @IsOptional() @IsString()  fullName?: string;
  @IsOptional() @IsString()  language?: string;
  @IsOptional() @IsString()  country?: string;
  @IsOptional() @IsBoolean() elderMode?: boolean;
}

@UseGuards(JwtAuthGuard)
@Controller('me')
export class UsersController {
  constructor(private prisma: PrismaService) {}
  @Get() me(@CurrentUser() u: any) {
    return this.prisma.user.findUnique({ where: { id: u.sub }, include: { riskProfile: true } });
  }
  @Patch() update(@CurrentUser() u: any, @Body() dto: UpdateProfileDto) {
    return this.prisma.user.update({ where: { id: u.sub }, data: { ...dto, onboardedAt: new Date() } });
  }
}