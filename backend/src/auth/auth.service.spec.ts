import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  restaurant: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  admin: {
    findUnique: jest.fn(),
  },
};

const mockJwt = { sign: jest.fn().mockReturnValue('signed-token') };
const mockEmail = { sendVerificationEmail: jest.fn().mockResolvedValue(undefined) };

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: EmailService, useValue: mockEmail },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  // ── registerRestaurant ────────────────────────────────────
  describe('registerRestaurant', () => {
    it('throws BadRequestException when email already exists', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue({ id: 'r1' });
      await expect(
        service.registerRestaurant({ name: 'Test', email: 'a@b.com', password: '123' })
      ).rejects.toThrow(BadRequestException);
      expect(mockPrisma.restaurant.create).not.toHaveBeenCalled();
    });

    it('creates restaurant and returns success message', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue(null);
      mockPrisma.restaurant.create.mockResolvedValue({ id: 'r1' });

      const result = await service.registerRestaurant({
        name: 'Cafe Test',
        email: 'cafe@test.com',
        password: 'pass123',
      });

      expect(result.message).toBeTruthy();
      const createCall = mockPrisma.restaurant.create.mock.calls[0][0];
      expect(createCall.data.email).toBe('cafe@test.com');
      expect(createCall.data.slug).toBe('cafe-test');
      const validHash = await bcrypt.compare('pass123', createCall.data.passwordHash);
      expect(validHash).toBe(true);
    });

    it('generates slug without special characters', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue(null);
      mockPrisma.restaurant.create.mockResolvedValue({ id: 'r1' });

      await service.registerRestaurant({ name: 'Café & Bar!', email: 'x@x.com', password: 'p' });

      const createCall = mockPrisma.restaurant.create.mock.calls[0][0];
      expect(createCall.data.slug).toMatch(/^[a-z0-9-]+$/);
    });
  });

  // ── loginRestaurant ───────────────────────────────────────
  describe('loginRestaurant', () => {
    const hash = bcrypt.hashSync('correct', 10);

    it('throws UnauthorizedException when restaurant not found', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue(null);
      await expect(
        service.loginRestaurant({ email: 'x@x.com', password: 'p' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException on wrong password', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue({
        id: 'r1', passwordHash: hash, subscription: null,
      });
      await expect(
        service.loginRestaurant({ email: 'x@x.com', password: 'wrong' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns token and restaurant on success', async () => {
      const restaurant = {
        id: 'r1', name: 'R', slug: 's', email: 'x@x.com',
        status: 'ACTIVE', passwordHash: hash, subscription: null,
      };
      mockPrisma.restaurant.findUnique.mockResolvedValue(restaurant);

      const result = await service.loginRestaurant({ email: 'x@x.com', password: 'correct' });

      expect(result.token).toBe('signed-token');
      expect(result.restaurant.id).toBe('r1');
    });
  });

  // ── loginAdmin ────────────────────────────────────────────
  describe('loginAdmin', () => {
    const hash = bcrypt.hashSync('adminpass', 10);

    it('throws UnauthorizedException when admin not found', async () => {
      mockPrisma.admin.findUnique.mockResolvedValue(null);
      await expect(
        service.loginAdmin({ email: 'a@a.com', password: 'x' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException on wrong password', async () => {
      mockPrisma.admin.findUnique.mockResolvedValue({ id: 'a1', email: 'a@a.com', passwordHash: hash });
      await expect(
        service.loginAdmin({ email: 'a@a.com', password: 'wrong' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns token and admin on success', async () => {
      mockPrisma.admin.findUnique.mockResolvedValue({ id: 'a1', email: 'a@a.com', passwordHash: hash });
      const result = await service.loginAdmin({ email: 'a@a.com', password: 'adminpass' });
      expect(result.token).toBe('signed-token');
      expect(result.admin.id).toBe('a1');
    });
  });
});
