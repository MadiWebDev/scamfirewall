// src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        fullName: dto.fullName,
        riskProfile: { create: { channelsEnabled: { call: true, sms: true, email: true, messaging: true, payment: true } } },
      },
    });
    return this.issueTokens(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return this.issueTokens(user.id, user.email, user.role);
  }

  async issueTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const accessToken = await this.jwt.signAsync(payload);
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_TTL ?? '30d',
    });
    const refreshHash = await argon2.hash(refreshToken);
    await this.prisma.session.create({
      data: { userId, refreshHash, expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000) },
    });
    return { accessToken, refreshToken, user: { id: userId, email, role } };
  }
}