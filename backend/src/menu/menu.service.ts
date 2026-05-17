import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  async getMenu(slug: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        theme: true,
        tagline: true,
        coverUrl: true,
        address: true,
        phone: true,
        workingHours: true,
        wifiInfo: true,
        showWelcome: true,
        instagramUrl: true,
        tiktokUrl: true,
        googleMapsUrl: true,
        googlePlaceId: true,
        status: true,
        subscription: { select: { endsAt: true } },
        categories: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            name: true,
            imageUrl: true,
            order: true,
            products: {
              where: { isAvailable: true },
              orderBy: { order: 'asc' },
              select: { id: true, name: true, description: true, price: true, discountedPrice: true, preparationTime: true, calories: true, allergens: true, imageUrl: true },
            },
          },
        },
        announcements: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, body: true, imageUrl: true, createdAt: true },
        },
      },
    });

    if (!restaurant) throw new NotFoundException('Menü bulunamadı.');

    const subActive = restaurant.subscription && new Date(restaurant.subscription.endsAt) > new Date();
    if (!subActive) {
      throw new HttpException(
        { message: 'Bu restoranın menüsü şu an kullanılamıyor.', code: 'SUBSCRIPTION_EXPIRED' },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const { subscription, ...rest } = restaurant;
    return rest;
  }

  async recordScan(slug: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!restaurant) return;
    await this.prisma.menuScan.create({ data: { restaurantId: restaurant.id } });
  }
}
