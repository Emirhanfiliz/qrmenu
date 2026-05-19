import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  category: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
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

  describe('create', () => {
    it('creates category with restaurantId', async () => {
      mockPrisma.category.create.mockResolvedValue({ id: 'c1', name: 'Başlangıçlar' });
      await service.create('r1', { name: 'Başlangıçlar' });
      expect(mockPrisma.category.create.mock.calls[0][0].data.restaurantId).toBe('r1');
    });
  });

  describe('update', () => {
    it('throws NotFoundException when category not found', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      await expect(service.update('r1', 'c1', { name: 'X' })).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when category belongs to different restaurant', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'c1', restaurantId: 'other' });
      await expect(service.update('r1', 'c1', { name: 'X' })).rejects.toThrow(NotFoundException);
    });

    it('updates category when owner matches', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'c1', restaurantId: 'r1' });
      mockPrisma.category.update.mockResolvedValue({ id: 'c1', name: 'Yeni' });
      await service.update('r1', 'c1', { name: 'Yeni' });
      expect(mockPrisma.category.update.mock.calls[0][0].data).toEqual({ name: 'Yeni' });
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when category not found', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      await expect(service.remove('r1', 'c1')).rejects.toThrow(NotFoundException);
    });

    it('deletes category when owner matches', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'c1', restaurantId: 'r1' });
      mockPrisma.category.delete.mockResolvedValue({ id: 'c1' });
      const result = await service.remove('r1', 'c1');
      expect(result.message).toBeTruthy();
      expect(mockPrisma.category.delete.mock.calls[0][0].where).toEqual({ id: 'c1' });
    });
  });

  describe('reorder', () => {
    it('calls updateMany for each id with correct order index', async () => {
      mockPrisma.category.updateMany.mockResolvedValue({ count: 1 });
      await service.reorder('r1', ['c3', 'c1', 'c2']);
      const calls = mockPrisma.category.updateMany.mock.calls;
      expect(calls).toHaveLength(3);
      expect(calls[0][0].data.order).toBe(0);
      expect(calls[1][0].data.order).toBe(1);
      expect(calls[2][0].data.order).toBe(2);
    });
  });
});
