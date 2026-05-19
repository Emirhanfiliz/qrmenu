import { HttpException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MenuService } from './menu.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  restaurant: { findUnique: jest.fn() },
  menuScan: { create: jest.fn() },
};

describe('MenuService', () => {
  let service: MenuService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        MenuService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(MenuService);
  });

  describe('getMenu', () => {
    const baseRestaurant = {
      id: 'r1',
      name: 'Test Kafe',
      logoUrl: null,
      theme: 'beach',
      tagline: null,
      coverUrl: null,
      address: null,
      phone: null,
      workingHours: null,
      wifiInfo: null,
      showWelcome: false,
      instagramUrl: null,
      tiktokUrl: null,
      googleMapsUrl: null,
      googlePlaceId: null,
      status: 'ACTIVE',
      categories: [],
      announcements: [],
    };

    it('throws NotFoundException when restaurant does not exist', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue(null);
      await expect(service.getMenu('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('throws 402 HttpException when subscription is expired', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue({
        ...baseRestaurant,
        subscription: { endsAt: new Date('2000-01-01') },
      });
      await expect(service.getMenu('test-kafe')).rejects.toThrow(HttpException);
      await expect(service.getMenu('test-kafe')).rejects.toMatchObject(
        expect.objectContaining({ status: 402 })
      );
    });

    it('throws 402 HttpException when restaurant has no subscription', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue({
        ...baseRestaurant,
        subscription: null,
      });
      await expect(service.getMenu('test-kafe')).rejects.toThrow(HttpException);
    });

    it('returns menu data without subscription field when active', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      mockPrisma.restaurant.findUnique.mockResolvedValue({
        ...baseRestaurant,
        subscription: { endsAt: futureDate },
      });

      const result = await service.getMenu('test-kafe');

      expect(result.name).toBe('Test Kafe');
      expect(result).not.toHaveProperty('subscription');
    });

    it('treats subscription expiring in the past as expired', async () => {
      const justNow = new Date(Date.now() - 1);
      mockPrisma.restaurant.findUnique.mockResolvedValue({
        ...baseRestaurant,
        subscription: { endsAt: justNow },
      });
      await expect(service.getMenu('test-kafe')).rejects.toThrow(HttpException);
    });
  });

  describe('recordScan', () => {
    it('creates scan record when restaurant exists', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue({ id: 'r1' });
      mockPrisma.menuScan.create.mockResolvedValue({});

      await service.recordScan('test-kafe');

      expect(mockPrisma.menuScan.create).toHaveBeenCalledWith({
        data: { restaurantId: 'r1' },
      });
    });

    it('does nothing when restaurant not found', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue(null);
      await service.recordScan('nonexistent');
      expect(mockPrisma.menuScan.create).not.toHaveBeenCalled();
    });
  });
});
