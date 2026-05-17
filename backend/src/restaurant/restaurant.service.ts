import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
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

  async changePassword(restaurantId: string, dto: { currentPassword: string; newPassword: string }) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    const valid = await bcrypt.compare(dto.currentPassword, restaurant!.passwordHash);
    if (!valid) throw new UnauthorizedException('Mevcut şifre hatalı.');
    const hash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.restaurant.update({ where: { id: restaurantId }, data: { passwordHash: hash } });
    return { message: 'Şifre güncellendi.' };
  }

  async getDesign(restaurantId: string) {
    return this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        theme: true,
        tagline: true,
        coverUrl: true,
        address: true,
        phone: true,
        workingHours: true,
        wifiInfo: true,
        showWelcome: true,
      },
    });
  }

  async updateDesign(
    restaurantId: string,
    dto: {
      theme?: string;
      tagline?: string;
      coverUrl?: string;
      address?: string;
      phone?: string;
      workingHours?: string;
      wifiInfo?: string;
      showWelcome?: boolean;
    },
  ) {
    return this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: dto,
      select: {
        theme: true,
        tagline: true,
        coverUrl: true,
        address: true,
        phone: true,
        workingHours: true,
        wifiInfo: true,
        showWelcome: true,
      },
    });
  }

  async getStats(restaurantId: string) {
    const [totalScans, categoryCount, productCount] = await Promise.all([
      this.prisma.menuScan.count({ where: { restaurantId } }),
      this.prisma.category.count({ where: { restaurantId } }),
      this.prisma.product.count({ where: { category: { restaurantId } } }),
    ]);
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const recentScans = await this.prisma.menuScan.count({
      where: { restaurantId, scannedAt: { gte: last30Days } },
    });
    return { totalScans, recentScans, categoryCount, productCount };
  }
}
