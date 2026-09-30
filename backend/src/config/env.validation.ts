import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  CORS_ORIGINS: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export const validateEnv = (raw: Record<string, unknown>) => {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    console.error('❌ Invalid environment variables', parsed.error.format());
    throw new Error('Invalid environment configuration');
  }
  return parsed.data;
};