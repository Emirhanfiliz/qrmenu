import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { RestaurantService } from './restaurant.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  restaurant: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  menuScan: { count: jest.fn(), deleteMany: jest.fn() },
  category: { count: jest.fn() },
  product: { count: jest.fn() },
  announcement: { count: jest.fn() },
  $queryRaw: jest.fn(),
};

describe('RestaurantService', () => {
  let service: RestaurantService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        RestaurantService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(RestaurantService);
  });

  // ── changePassword ────────────────────────────────────────
  describe('changePassword', () => {
    const currentHash = bcrypt.hashSync('old-pass', 10);

    // AC-1: Wrong current password is rejected
    it('throws UnauthorizedException when current password is wrong', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue({ id: 'r1', passwordHash: currentHash });
      await expect(
        service.changePassword('r1', { currentPassword: 'wrong', newPassword: 'new123' })
      ).rejects.toThrow(UnauthorizedException);
      expect(mockPrisma.restaurant.update).not.toHaveBeenCalled();
    });

    // AC-2: Correct current password updates the hash
    it('updates password hash when current password is correct', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue({ id: 'r1', passwordHash: currentHash });
      mockPrisma.restaurant.update.mockResolvedValue({ id: 'r1' });

      const result = await service.changePassword('r1', { currentPassword: 'old-pass', newPassword: 'new-pass' });

      expect(result.message).toBeTruthy();
      const updateCall = mockPrisma.restaurant.update.mock.calls[0][0];
      // New hash must not equal old hash or plaintext
      expect(updateCall.data.passwordHash).not.toBe(currentHash);
      expect(updateCall.data.passwordHash).not.toBe('new-pass');
      // New hash must verify against new password
      const valid = await bcrypt.compare('new-pass', updateCall.data.passwordHash);
      expect(valid).toBe(true);
    });
  });

  // ── getDesign / updateDesign ──────────────────────────────
  describe('getDesign', () => {
    // AC-3: Returns design fields
    it('queries only design-related fields', async () => {
      const designData = {
        theme: 'new21',
        tagline: 'Test',
        coverUrl: null,
        address: 'Addr',
        phone: '123',
        workingHours: '09-23',
        wifiInfo: null,
        showWelcome: true,
      };
      mockPrisma.restaurant.findUnique.mockResolvedValue(designData);

      const result = await service.getDesign('r1');
      expect(result).toEqual(designData);
    });
  });

  describe('updateDesign', () => {
    // AC-4: Partial updates are applied correctly
    it('updates only provided fields', async () => {
      const updated = { theme: 'beach', tagline: 'Hello', coverUrl: null, address: null, phone: null, workingHours: null, wifiInfo: null, showWelcome: false };
      mockPrisma.restaurant.update.mockResolvedValue(updated);

      await service.updateDesign('r1', { theme: 'beach', tagline: 'Hello' });

      const updateCall = mockPrisma.restaurant.update.mock.calls[0][0];
      expect(updateCall.data).toEqual({ theme: 'beach', tagline: 'Hello' });
      expect(updateCall.where).toEqual({ id: 'r1' });
    });

    // AC-5: showWelcome boolean is persisted correctly
    it('persists showWelcome boolean', async () => {
      mockPrisma.restaurant.update.mockResolvedValue({});
      await service.updateDesign('r1', { showWelcome: true });
      const updateCall = mockPrisma.restaurant.update.mock.calls[0][0];
      expect(updateCall.data.showWelcome).toBe(true);
    });
  });

  // ── getStats ──────────────────────────────────────────────
  describe('getStats', () => {
    it('returns stat fields and dailyScans', async () => {
      mockPrisma.menuScan.count.mockResolvedValue(10);
      mockPrisma.category.count.mockResolvedValue(5);
      mockPrisma.product.count.mockResolvedValue(42);
      mockPrisma.announcement.count.mockResolvedValue(2);
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const result = await service.getStats('r1');

      expect(result.todayScans).toBe(10);
      expect(result.categoryCount).toBe(5);
      expect(result.productCount).toBe(42);
      expect(result.activeAnnouncementCount).toBe(2);
      expect(Array.isArray(result.dailyScans)).toBe(true);
    });
  });
});
