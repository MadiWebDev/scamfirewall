import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash('Password123!');
  await prisma.user.upsert({
    where: { email: 'demo@scamfirewall.app' },
    update: {},
    create: {
      email: 'demo@scamfirewall.app',
      passwordHash,
      fullName: 'Demo User',
      onboardedAt: new Date(),
      riskProfile: { create: { channelsEnabled: { call: true, sms: true, email: true, payment: true } } },
    },
  });
  console.log('Seeded demo@scamfirewall.app / Password123!');
}
main().finally(() => prisma.$disconnect());