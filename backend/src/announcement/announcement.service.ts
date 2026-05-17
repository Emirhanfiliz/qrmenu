import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnnouncementService {
  constructor(private prisma: PrismaService) {}

  list(restaurantId: string) {
    return this.prisma.announcement.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(restaurantId: string, dto: { title: string; body: string; imageUrl?: string }) {
    return this.prisma.announcement.create({ data: { restaurantId, ...dto } });
  }

  async update(restaurantId: string, id: string, dto: { title?: string; body?: string; imageUrl?: string; isActive?: boolean }) {
    await this.assertOwner(restaurantId, id);
    return this.prisma.announcement.update({ where: { id }, data: dto });
  }

  async remove(restaurantId: string, id: string) {
    await this.assertOwner(restaurantId, id);
    await this.prisma.announcement.delete({ where: { id } });
    return { message: 'Duyuru silindi.' };
  }

  private async assertOwner(restaurantId: string, id: string) {
    const ann = await this.prisma.announcement.findUnique({ where: { id } });
    if (!ann || ann.restaurantId !== restaurantId) throw new NotFoundException('Duyuru bulunamadı.');
  }
}
