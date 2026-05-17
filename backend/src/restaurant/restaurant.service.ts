import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RestaurantService {
  constructor(private prisma: PrismaService) {}

  async getMe(restaurantId: string) {
    return this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        logoUrl: true,
        status: true,
        createdAt: true,
        subscription: true,
      },
    });
  }

  async updateMe(restaurantId: string, dto: { name?: string; logoUrl?: string }) {
    return this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: dto,
      select: { id: true, name: true, slug: true, email: true, logoUrl: true },
    });
  }

  async getStats(restaurantId: string) {
    const [totalScans, categoryCount, productCount] = await Promise.all([
      this.prisma.menuScan.count({ where: { restaurantId } }),
      this.prisma.category.count({ where: { restaurantId } }),
      this.prisma.product.count({
        where: { category: { restaurantId } },
      }),
    ]);

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const recentScans = await this.prisma.menuScan.count({
      where: { restaurantId, scannedAt: { gte: last30Days } },
    });

    return { totalScans, recentScans, categoryCount, productCount };
  }
}
