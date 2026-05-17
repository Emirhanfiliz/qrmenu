import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async list(restaurantId: string, categoryId?: string) {
    return this.prisma.product.findMany({
      where: {
        category: { restaurantId },
        ...(categoryId ? { categoryId } : {}),
      },
      orderBy: [{ categoryId: 'asc' }, { order: 'asc' }],
      include: { category: { select: { id: true, name: true } } },
    });
  }

  async create(restaurantId: string, dto: {
    categoryId: string;
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
    isAvailable?: boolean;
  }) {
    await this.assertCategoryOwner(restaurantId, dto.categoryId);
    return this.prisma.product.create({ data: dto });
  }

  async update(restaurantId: string, id: string, dto: {
    categoryId?: string;
    name?: string;
    description?: string;
    price?: number;
    imageUrl?: string;
    isAvailable?: boolean;
    order?: number;
  }) {
    await this.assertProductOwner(restaurantId, id);
    if (dto.categoryId) await this.assertCategoryOwner(restaurantId, dto.categoryId);
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async reorder(restaurantId: string, ids: string[]) {
    await Promise.all(
      ids.map((id, index) =>
        this.prisma.product.updateMany({
          where: { id, category: { restaurantId } },
          data: { order: index },
        }),
      ),
    );
    return { message: 'Sıralama güncellendi.' };
  }

  async remove(restaurantId: string, id: string) {
    await this.assertProductOwner(restaurantId, id);
    await this.prisma.product.delete({ where: { id } });
    return { message: 'Ürün silindi.' };
  }

  private async assertCategoryOwner(restaurantId: string, categoryId: string) {
    const cat = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!cat || cat.restaurantId !== restaurantId) throw new NotFoundException('Kategori bulunamadı.');
  }

  private async assertProductOwner(restaurantId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { category: true },
    });
    if (!product || product.category.restaurantId !== restaurantId) {
      throw new NotFoundException('Ürün bulunamadı.');
    }
  }
}
