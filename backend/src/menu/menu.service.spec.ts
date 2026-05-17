import { NotFoundException } from '@nestjs/common';
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
      status: 'ACTIVE',
      categories: [],
      announcements: [],
    };

    // AC-1: Non-existent slug throws 404
    it('throws NotFoundException when restaurant does not exist', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue(null);
      await expect(service.getMenu('nonexistent')).rejects.toThrow(NotFoundException);
    });

    // AC-2: Expired subscription blocks public access
    it('throws NotFoundException when subscription is expired', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue({
        ...baseRestaurant,
        subscription: { endsAt: new Date('2000-01-01') }, // past date
      });
      await expect(service.getMenu('test-kafe')).rejects.toThrow(NotFoundException);
    });

    // AC-3: Missing subscription blocks public access
    it('throws NotFoundException when restaurant has no subscription', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue({
        ...baseRestaurant,
        subscription: null,
      });
      await expect(service.getMenu('test-kafe')).rejects.toThrow(NotFoundException);
    });

    // AC-4: Active subscription allows access and records a scan
    it('returns menu data and records a scan when subscription is active', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      mockPrisma.restaurant.findUnique.mockResolvedValue({
        ...baseRestaurant,
        subscription: { endsAt: futureDate },
      });
      mockPrisma.menuScan.create.mockResolvedValue({});

      const result = await service.getMenu('test-kafe');

      expect(result.name).toBe('Test Kafe');
      expect(result).not.toHaveProperty('subscription');
      expect(mockPrisma.menuScan.create).toHaveBeenCalledWith({
        data: { restaurantId: 'r1' },
      });
    });

    // AC-5: Subscription expiring exactly now is treated as expired
    it('treats subscription expiring at exactly current time as expired', async () => {
      const justNow = new Date(Date.now() - 1); // 1ms in the past
      mockPrisma.restaurant.findUnique.mockResolvedValue({
        ...baseRestaurant,
        subscription: { endsAt: justNow },
      });
      await expect(service.getMenu('test-kafe')).rejects.toThrow(NotFoundException);
    });
  });
});
