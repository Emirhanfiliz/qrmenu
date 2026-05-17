import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const hash = await bcrypt.hash('admin123', 10);
await prisma.admin.upsert({
  where: { email: 'admin@admin.com' },
  update: { passwordHash: hash },
  create: { email: 'admin@admin.com', passwordHash: hash },
});

console.log('Admin olusturuldu: admin@admin.com / admin123');
await prisma.$disconnect();
