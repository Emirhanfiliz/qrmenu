import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  category: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
  },
};

describe('CategoryService', () => {
  let service: CategoryService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        CategoryService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(CategoryService);
  });

  // ── reorder ───────────────────────────────────────────────
  describe('reorder', () => {
    // AC-1: Each id gets its array-index as order value
    it('updates order for each category based on array position', async () => {
      mockPrisma.category.updateMany.mockResolvedValue({ count: 1 });

      const ids = ['c3', 'c1', 'c2'];
      await service.reorder('r1', ids);

      expect(mockPrisma.category.updateMany).toHaveBeenCalledTimes(3);
      expect(mockPrisma.category.updateMany).toHaveBeenNthCalledWith(1, {
        where: { id: 'c3', restaurantId: 'r1' },
        data: { order: 0 },
      });
      expect(mockPrisma.category.updateMany).toHaveBeenNthCalledWith(2, {
        where: { id: 'c1', restaurantId: 'r1' },
        data: { order: 1 },
      });
      expect(mockPrisma.category.updateMany).toHaveBeenNthCalledWith(3, {
        where: { id: 'c2', restaurantId: 'r1' },
        data: { order: 2 },
      });
    });

    // AC-2: Only the requesting restaurant's categories are touched
    it('filters by restaurantId to prevent cross-restaurant writes', async () => {
      mockPrisma.category.updateMany.mockResolvedValue({ count: 1 });

      await service.reorder('restaurant-A', ['c1', 'c2']);

      mockPrisma.category.updateMany.mock.calls.forEach((call) => {
        expect(call[0].where.restaurantId).toBe('restaurant-A');
      });
    });

    // AC-3: Empty array is a no-op
    it('makes no DB calls when ids array is empty', async () => {
      await service.reorder('r1', []);
      expect(mockPrisma.category.updateMany).not.toHaveBeenCalled();
    });
  });

  // ── remove ────────────────────────────────────────────────
  describe('remove', () => {
    // AC-4: Cannot delete another restaurant's category
    it('throws NotFoundException when category belongs to another restaurant', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'c1', restaurantId: 'other-restaurant' });
      await expect(service.remove('r1', 'c1')).rejects.toThrow(NotFoundException);
      expect(mockPrisma.category.delete).not.toHaveBeenCalled();
    });

    // AC-5: Can delete own category
    it('deletes category when it belongs to the requesting restaurant', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'c1', restaurantId: 'r1' });
      mockPrisma.category.delete.mockResolvedValue({ id: 'c1' });
      const result = await service.remove('r1', 'c1');
      expect(mockPrisma.category.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
      expect(result.message).toBeTruthy();
    });
  });
});
