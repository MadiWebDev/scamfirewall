// src/queue/queue.module.ts
import { Global, Module } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

export const ANALYSIS_QUEUE = 'analysis-queue';
export const NOTIFICATION_QUEUE = 'notification-queue';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS',
      useFactory: () => new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', { maxRetriesPerRequest: null }),
    },
    {
      provide: ANALYSIS_QUEUE,
      useFactory: (redis: IORedis) => new Queue(ANALYSIS_QUEUE, { connection: redis }),
      inject: ['REDIS'],
    },
    {
      provide: NOTIFICATION_QUEUE,
      useFactory: (redis: IORedis) => new Queue(NOTIFICATION_QUEUE, { connection: redis }),
      inject: ['REDIS'],
    },
  ],
  exports: ['REDIS', ANALYSIS_QUEUE, NOTIFICATION_QUEUE],
})
export class QueueModule {}