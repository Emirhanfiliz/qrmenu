import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  list(restaurantId: string) {
    return this.prisma.category.findMany({
      where: { restaurantId },
      orderBy: { order: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  create(restaurantId: string, dto: { name: string; imageUrl?: string }) {
    return this.prisma.category.create({
      data: { restaurantId, name: dto.name, imageUrl: dto.imageUrl },
    });
  }

  async update(restaurantId: string, id: string, dto: { name?: string; imageUrl?: string; order?: number }) {
    await this.assertOwner(restaurantId, id);
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async reorder(restaurantId: string, ids: string[]) {
    await Promise.all(
      ids.map((id, index) =>
        this.prisma.category.updateMany({
          where: { id, restaurantId },
          data: { order: index },
        }),
      ),
    );
    return { message: 'Sıralama güncellendi.' };
  }

  async remove(restaurantId: string, id: string) {
    await this.assertOwner(restaurantId, id);
    await this.prisma.category.delete({ where: { id } });
    return { message: 'Kategori silindi.' };
  }

  private async assertOwner(restaurantId: string, id: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat || cat.restaurantId !== restaurantId) throw new NotFoundException('Kategori bulunamadı.');
  }
}
