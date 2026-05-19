import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { RestaurantStatus, SubscriptionType } from '@prisma/client';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  restaurant: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  subscription: {
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  adminLog: {
    create: jest.fn().mockResolvedValue({}),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  menuScan: { count: jest.fn() },
  $transaction: jest.fn(),
  $queryRaw: jest.fn(),
};

describe('AdminService', () => {
  let service: AdminService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(AdminService);
  });

  describe('approveAndSubscribe', () => {
    it('throws NotFoundException when restaurant not found', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue(null);
      await expect(
        service.approveAndSubscribe('bad-id', SubscriptionType.TRIAL, 'a1')
      ).rejects.toThrow(NotFoundException);
    });

    it('runs transaction to activate restaurant and create subscription', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue({ id: 'r1', name: 'R', slug: 's', subscription: null });
      mockPrisma.$transaction.mockResolvedValue([]);

      await service.approveAndSubscribe('r1', SubscriptionType.TRIAL, 'a1');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('renewSubscription', () => {
    it('throws NotFoundException when restaurant not found', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue(null);
      await expect(
        service.renewSubscription('bad-id', SubscriptionType.ANNUAL, 'a1')
      ).rejects.toThrow(NotFoundException);
    });

    it('creates subscription when none exists', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue({ id: 'r1', name: 'R', slug: 's', subscription: null });
      mockPrisma.subscription.create.mockResolvedValue({});

      await service.renewSubscription('r1', SubscriptionType.ANNUAL, 'a1');

      expect(mockPrisma.subscription.create).toHaveBeenCalled();
      const createData = mockPrisma.subscription.create.mock.calls[0][0].data;
      expect(createData.restaurantId).toBe('r1');
      const days = Math.round((createData.endsAt - createData.startsAt) / 86400000);
      expect(days).toBe(365);
    });

    it('updates existing subscription', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue({
        id: 'r1', name: 'R', slug: 's', subscription: { restaurantId: 'r1' },
      });
      mockPrisma.subscription.update.mockResolvedValue({});

      await service.renewSubscription('r1', SubscriptionType.TRIAL, 'a1');

      expect(mockPrisma.subscription.update).toHaveBeenCalled();
      const updateData = mockPrisma.subscription.update.mock.calls[0][0].data;
      const days = Math.round((updateData.endsAt - updateData.startsAt) / 86400000);
      expect(days).toBe(30);
    });
  });

  describe('suspendRestaurant', () => {
    it('throws NotFoundException when restaurant not found', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue(null);
      await expect(service.suspendRestaurant('bad-id', 'a1')).rejects.toThrow(NotFoundException);
    });

    it('sets restaurant status to SUSPENDED', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue({ id: 'r1', name: 'R', slug: 's' });
      mockPrisma.restaurant.update.mockResolvedValue({});

      await service.suspendRestaurant('r1', 'a1');

      const updateCall = mockPrisma.restaurant.update.mock.calls[0][0];
      expect(updateCall.data.status).toBe(RestaurantStatus.SUSPENDED);
    });
  });
});
