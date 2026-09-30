import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { FamilyModule } from './modules/family/family.module';
import { TrustedContactsModule } from './modules/trusted-contacts/trusted-contacts.module';
import { ScamEventsModule } from './modules/scam-events/scam-events.module';
import { SignalAnalysisModule } from './modules/signal-analysis/signal-analysis.module';
import { InterventionModule } from './modules/intervention/intervention.module';
import { EscalationModule } from './modules/escalation/escalation.module';
import { RecoveryModule } from './modules/recovery/recovery.module';
import { PolicyModule } from './modules/policy/policy.module';
import { EnterpriseModule } from './modules/enterprise/enterprise.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditModule } from './modules/audit/audit.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { singleLine: true } }
          : undefined,
        redact: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.passwordHash'],
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    QueueModule,
    AuthModule,
    UsersModule,
    FamilyModule,
    TrustedContactsModule,
    ScamEventsModule,
    SignalAnalysisModule,
    InterventionModule,
    EscalationModule,
    RecoveryModule,
    PolicyModule,
    EnterpriseModule,
    NotificationsModule,
    AuditModule,
    AnalyticsModule,
  ],
})
export class AppModule {}