import { Injectable, NotFoundException } from '@nestjs/common';
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
              select: { id: true, name: true, description: true, price: true, imageUrl: true },
            },
          },
        },
        announcements: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, body: true, createdAt: true },
        },
      },
    });

    if (!restaurant) throw new NotFoundException('Menü bulunamadı.');

    const subActive = restaurant.subscription && new Date(restaurant.subscription.endsAt) > new Date();
    if (!subActive) throw new NotFoundException('Menü bulunamadı.');

    await this.prisma.menuScan.create({ data: { restaurantId: restaurant.id } });

    const { subscription, ...rest } = restaurant;
    return rest;
  }
}
