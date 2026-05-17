import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
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

const mockJwt = { sign: jest.fn().mockReturnValue('mock-token') };

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  // ── Register ──────────────────────────────────────────────
  describe('registerRestaurant', () => {
    const dto = { name: 'Test Kafe', email: 'test@test.com', password: 'pass123' };

    // AC-1: Duplicate email is rejected
    it('throws BadRequestException if email already registered', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue({ id: 'r1' });
      await expect(service.registerRestaurant(dto)).rejects.toThrow(BadRequestException);
      expect(mockPrisma.restaurant.create).not.toHaveBeenCalled();
    });

    // AC-2: New registration succeeds and returns a message
    it('creates restaurant and returns success message for new email', async () => {
      mockPrisma.restaurant.findUnique
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce(null); // slug uniqueness check
      mockPrisma.restaurant.create.mockResolvedValue({ id: 'r1' });

      const result = await service.registerRestaurant(dto);
      expect(result.message).toContain('Kayıt');
      expect(mockPrisma.restaurant.create).toHaveBeenCalledTimes(1);
    });

    // AC-3: Slug is generated from name (lowercase, dashes)
    it('generates a URL-safe slug from restaurant name', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue(null);
      mockPrisma.restaurant.create.mockResolvedValue({ id: 'r1' });

      await service.registerRestaurant({ ...dto, name: 'Çay Bahçesi Café' });

      const createCall = mockPrisma.restaurant.create.mock.calls[0][0];
      expect(createCall.data.slug).toMatch(/^[a-z0-9-]+$/);
    });

    // AC-4: Password is hashed, not stored in plain text
    it('stores hashed password, not plaintext', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue(null);
      mockPrisma.restaurant.create.mockResolvedValue({ id: 'r1' });

      await service.registerRestaurant(dto);

      const createCall = mockPrisma.restaurant.create.mock.calls[0][0];
      expect(createCall.data.passwordHash).not.toBe(dto.password);
      const valid = await bcrypt.compare(dto.password, createCall.data.passwordHash);
      expect(valid).toBe(true);
    });
  });

  // ── Restaurant Login ──────────────────────────────────────
  describe('loginRestaurant', () => {
    const hash = bcrypt.hashSync('correct-pass', 10);
    const mockRestaurant = {
      id: 'r1',
      name: 'Test',
      email: 'test@test.com',
      status: 'ACTIVE',
      passwordHash: hash,
      subscription: null,
    };

    // AC-5: Non-existent email is rejected
    it('throws UnauthorizedException for unknown email', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue(null);
      await expect(service.loginRestaurant({ email: 'x@x.com', password: 'pass' }))
        .rejects.toThrow(UnauthorizedException);
    });

    // AC-6: Wrong password is rejected (no token leak)
    it('throws UnauthorizedException for wrong password', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue(mockRestaurant);
      await expect(service.loginRestaurant({ email: 'test@test.com', password: 'wrong' }))
        .rejects.toThrow(UnauthorizedException);
      expect(mockJwt.sign).not.toHaveBeenCalled();
    });

    // AC-7: Correct credentials return token
    it('returns token and restaurant data for correct credentials', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue(mockRestaurant);
      const result = await service.loginRestaurant({ email: 'test@test.com', password: 'correct-pass' });
      expect(result.token).toBe('mock-token');
      expect(result.restaurant.id).toBe('r1');
      expect(result.restaurant).not.toHaveProperty('passwordHash');
    });
  });

  // ── Admin Login ───────────────────────────────────────────
  describe('loginAdmin', () => {
    const hash = bcrypt.hashSync('adminpass', 10);

    // AC-8: Unknown admin email rejected
    it('throws UnauthorizedException for unknown admin email', async () => {
      mockPrisma.admin.findUnique.mockResolvedValue(null);
      await expect(service.loginAdmin({ email: 'x@x.com', password: 'p' }))
        .rejects.toThrow(UnauthorizedException);
    });

    // AC-9: Correct admin credentials return token
    it('returns token for correct admin credentials', async () => {
      mockPrisma.admin.findUnique.mockResolvedValue({ id: 'a1', email: 'admin@admin.com', passwordHash: hash });
      const result = await service.loginAdmin({ email: 'admin@admin.com', password: 'adminpass' });
      expect(result.token).toBe('mock-token');
      expect(result.admin.email).toBe('admin@admin.com');
    });
  });
});
