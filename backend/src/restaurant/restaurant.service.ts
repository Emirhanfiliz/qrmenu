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
        instagramUrl: true,
        tiktokUrl: true,
        googleMapsUrl: true,
        googlePlaceId: true,
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
      instagramUrl?: string;
      tiktokUrl?: string;
      googleMapsUrl?: string;
      googlePlaceId?: string;
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
        instagramUrl: true,
        tiktokUrl: true,
        googleMapsUrl: true,
        googlePlaceId: true,
      },
    });
  }

  async searchGooglePlace(query: string) {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) throw new Error('Google Places API key not configured.');
    const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id,name,formatted_address&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json() as { candidates: { place_id: string; name: string; formatted_address: string }[] };
    return data.candidates.slice(0, 3).map((c) => ({
      placeId: c.place_id,
      name: c.name,
      address: c.formatted_address,
    }));
  }

  async getStats(restaurantId: string) {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    last30Days.setHours(0, 0, 0, 0);

    const [totalScans, categoryCount, productCount, recentScans, dailyRaw] = await Promise.all([
      this.prisma.menuScan.count({ where: { restaurantId } }),
      this.prisma.category.count({ where: { restaurantId } }),
      this.prisma.product.count({ where: { category: { restaurantId } } }),
      this.prisma.menuScan.count({ where: { restaurantId, scannedAt: { gte: last30Days } } }),
      this.prisma.$queryRaw<{ date: string; count: bigint }[]>`
        SELECT TO_CHAR(DATE("scannedAt"), 'YYYY-MM-DD') as date, COUNT(*)::bigint as count
        FROM menu_scans
        WHERE "restaurantId" = ${restaurantId}
          AND "scannedAt" >= ${last30Days}
        GROUP BY DATE("scannedAt")
        ORDER BY DATE("scannedAt")
      `,
    ]);

    // Fill in zero-count days for the last 30 days
    const countMap = new Map(dailyRaw.map((r) => [r.date, Number(r.count)]));
    const dailyScans: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyScans.push({ date: key, count: countMap.get(key) ?? 0 });
    }

    return { totalScans, recentScans, categoryCount, productCount, dailyScans };
  }
}
