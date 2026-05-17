import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ProductService } from './product.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  product: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
  },
  category: { findUnique: jest.fn() },
};

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ProductService);
  });

  // ── reorder ───────────────────────────────────────────────
  describe('reorder', () => {
    // AC-1: Order values match array positions
    it('assigns order values matching array index', async () => {
      mockPrisma.product.updateMany.mockResolvedValue({ count: 1 });

      await service.reorder('r1', ['p2', 'p3', 'p1']);

      expect(mockPrisma.product.updateMany).toHaveBeenNthCalledWith(1, {
        where: { id: 'p2', category: { restaurantId: 'r1' } },
        data: { order: 0 },
      });
      expect(mockPrisma.product.updateMany).toHaveBeenNthCalledWith(3, {
        where: { id: 'p1', category: { restaurantId: 'r1' } },
        data: { order: 2 },
      });
    });

    // AC-2: restaurantId guard prevents cross-restaurant tampering
    it('scopes updates through category.restaurantId', async () => {
      mockPrisma.product.updateMany.mockResolvedValue({ count: 1 });

      await service.reorder('my-restaurant', ['p1']);

      const call = mockPrisma.product.updateMany.mock.calls[0][0];
      expect(call.where.category.restaurantId).toBe('my-restaurant');
    });
  });

  // ── create ────────────────────────────────────────────────
  describe('create', () => {
    // AC-3: Cannot create a product in another restaurant's category
    it('throws NotFoundException when categoryId belongs to another restaurant', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'cat1', restaurantId: 'other' });
      await expect(
        service.create('my-restaurant', { categoryId: 'cat1', name: 'Burger', price: 100 })
      ).rejects.toThrow(NotFoundException);
      expect(mockPrisma.product.create).not.toHaveBeenCalled();
    });

    // AC-4: Creates product in own category
    it('creates product when category belongs to the restaurant', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'cat1', restaurantId: 'r1' });
      mockPrisma.product.create.mockResolvedValue({ id: 'p1' });

      await service.create('r1', { categoryId: 'cat1', name: 'Burger', price: 100 });
      expect(mockPrisma.product.create).toHaveBeenCalledTimes(1);
    });
  });

  // ── update ────────────────────────────────────────────────
  describe('update', () => {
    // AC-5: Cannot update another restaurant's product
    it('throws NotFoundException when product belongs to another restaurant', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        category: { restaurantId: 'other' },
      });
      await expect(service.update('r1', 'p1', { name: 'New Name' })).rejects.toThrow(NotFoundException);
      expect(mockPrisma.product.update).not.toHaveBeenCalled();
    });

    // AC-6: isAvailable toggle updates the field
    it('updates isAvailable field when toggled', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'p1', category: { restaurantId: 'r1' } });
      mockPrisma.product.update.mockResolvedValue({ id: 'p1', isAvailable: false });

      await service.update('r1', 'p1', { isAvailable: false });

      const updateCall = mockPrisma.product.update.mock.calls[0][0];
      expect(updateCall.data.isAvailable).toBe(false);
    });
  });
});
