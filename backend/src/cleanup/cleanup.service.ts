import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async deleteOldScans() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);

    const { count } = await this.prisma.menuScan.deleteMany({
      where: { scannedAt: { lt: cutoff } },
    });

    if (count > 0) {
      this.logger.log(`90 günden eski ${count} tarama kaydı silindi.`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async clearExpiredVerificationTokens() {
    const { count } = await this.prisma.restaurant.updateMany({
      where: {
        emailVerificationExpires: { lt: new Date() },
        emailVerifiedAt: null,
      },
      data: {
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    if (count > 0) {
      this.logger.log(`${count} süresi dolmuş doğrulama kodu temizlendi.`);
    }
  }
}
