import {
  BadRequestException,
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
}
