import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RestaurantStatus, SubscriptionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  getRestaurants(status?: RestaurantStatus) {
    return this.prisma.restaurant.findMany({
      where: status ? { status } : undefined,
      include: { subscription: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveAndSubscribe(
    restaurantId: string,
    type: SubscriptionType,
  ) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { subscription: true },
    });
    if (!restaurant) throw new NotFoundException('Restoran bulunamadı.');

    const days = type === SubscriptionType.TRIAL ? 30 : 365;
    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + days);

    await this.prisma.$transaction([
      this.prisma.restaurant.update({
        where: { id: restaurantId },
        data: { status: RestaurantStatus.ACTIVE },
      }),
      restaurant.subscription
        ? this.prisma.subscription.update({
            where: { restaurantId },
            data: { type, startsAt, endsAt },
          })
        : this.prisma.subscription.create({
            data: { restaurantId, type, startsAt, endsAt },
          }),
    ]);

    return { message: 'Restoran onaylandı ve abonelik atandı.' };
  }

  async renewSubscription(restaurantId: string, type: SubscriptionType) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { subscription: true },
    });
    if (!restaurant) throw new NotFoundException('Restoran bulunamadı.');

    const days = type === SubscriptionType.TRIAL ? 30 : 365;
    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + days);

    if (restaurant.subscription) {
      await this.prisma.subscription.update({
        where: { restaurantId },
        data: { type, startsAt, endsAt },
      });
    } else {
      await this.prisma.subscription.create({
        data: { restaurantId, type, startsAt, endsAt },
      });
    }

    return { message: 'Abonelik yenilendi.' };
  }

  async suspendRestaurant(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) throw new NotFoundException('Restoran bulunamadı.');

    await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: { status: RestaurantStatus.SUSPENDED },
    });

    return { message: 'Restoran askıya alındı.' };
  }

  async getStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 6);
    const soon = new Date(now);
    soon.setDate(soon.getDate() + 7);

    const [total, active, pending, suspended, todayScans, weekScans, expiringSoon, newThisWeek] =
      await Promise.all([
        this.prisma.restaurant.count(),
        this.prisma.restaurant.count({ where: { status: RestaurantStatus.ACTIVE } }),
        this.prisma.restaurant.count({ where: { status: RestaurantStatus.PENDING } }),
        this.prisma.restaurant.count({ where: { status: RestaurantStatus.SUSPENDED } }),
        this.prisma.menuScan.count({ where: { scannedAt: { gte: todayStart } } }),
        this.prisma.menuScan.count({ where: { scannedAt: { gte: weekStart } } }),
        this.prisma.subscription.count({
          where: { endsAt: { gte: now, lte: soon }, restaurant: { status: RestaurantStatus.ACTIVE } },
        }),
        this.prisma.restaurant.count({ where: { createdAt: { gte: weekStart } } }),
      ]);

    const dailyScans = await this.prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT DATE("scannedAt") as date, COUNT(*) as count
      FROM menu_scans
      WHERE "scannedAt" >= ${weekStart}
      GROUP BY DATE("scannedAt")
      ORDER BY date ASC
    `;

    const recentActivity = await this.prisma.restaurant.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { subscription: true },
    });

    return {
      totals: { total, active, pending, suspended },
      scans: { today: todayScans, week: weekScans },
      expiringSoon,
      newThisWeek,
      dailyScans: dailyScans.map((r) => ({ date: r.date, count: Number(r.count) })),
      recentActivity,
    };
  }

  async getRestaurantDetail(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        subscription: true,
        categories: {
          include: { products: { select: { id: true } } },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!restaurant) throw new NotFoundException('Restoran bulunamadı.');

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

    const [totalScans, dailyScans] = await Promise.all([
      this.prisma.menuScan.count({ where: { restaurantId: id } }),
      this.prisma.$queryRaw<{ date: string; count: bigint }[]>`
        SELECT DATE("scannedAt") as date, COUNT(*) as count
        FROM menu_scans
        WHERE "restaurantId" = ${id} AND "scannedAt" >= ${thirtyDaysAgo}
        GROUP BY DATE("scannedAt")
        ORDER BY date ASC
      `,
    ]);

    const categoryCount = restaurant.categories.length;
    const productCount = restaurant.categories.reduce((s, c) => s + c.products.length, 0);

    return {
      ...restaurant,
      stats: {
        categoryCount,
        productCount,
        totalScans,
        dailyScans: dailyScans.map((r) => ({ date: r.date, count: Number(r.count) })),
      },
    };
  }
}
