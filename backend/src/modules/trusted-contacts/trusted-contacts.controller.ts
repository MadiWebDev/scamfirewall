// src/modules/trusted-contacts/trusted-contacts.controller.ts
import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

class CreateTrustedContactDto {
  @IsString() displayName!: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail()  email?: string;
  @IsOptional() @IsString() channelPref?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('trusted-contacts')
export class TrustedContactsController {
  constructor(private prisma: PrismaService) {}
  @Get() list(@CurrentUser() u: any) { return this.prisma.trustedContact.findMany({ where: { ownerUserId: u.sub } }); }
  @Post() create(@CurrentUser() u: any, @Body() dto: CreateTrustedContactDto) {
    return this.prisma.trustedContact.create({ data: { ...dto, ownerUserId: u.sub } });
  }
  @Delete(':id') remove(@CurrentUser() u: any, @Param('id') id: string) {
    return this.prisma.trustedContact.deleteMany({ where: { id, ownerUserId: u.sub } });
  }
}