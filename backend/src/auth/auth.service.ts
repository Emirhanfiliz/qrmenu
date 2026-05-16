import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async registerRestaurant(dto: { name: string; email: string; password: string }) {
    const exists = await this.prisma.restaurant.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new BadRequestException('Bu email zaten kayıtlı.');

    const slug = dto.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    const uniqueSlug = await this.ensureUniqueSlug(slug);
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const restaurant = await this.prisma.restaurant.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        slug: uniqueSlug,
      },
    });

    return { message: 'Kayıt başarılı. Hesabınız admin onayı bekliyor.' };
  }

  async loginRestaurant(dto: { email: string; password: string }) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { email: dto.email },
      include: { subscription: true },
    });

    if (!restaurant) throw new UnauthorizedException('Email veya şifre hatalı.');

    const valid = await bcrypt.compare(dto.password, restaurant.passwordHash);
    if (!valid) throw new UnauthorizedException('Email veya şifre hatalı.');

    const token = this.jwt.sign(
      { sub: restaurant.id, type: 'restaurant' },
      { expiresIn: '30d' },
    );

    return {
      token,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        email: restaurant.email,
        status: restaurant.status,
        subscription: restaurant.subscription,
      },
    };
  }

  async loginAdmin(dto: { email: string; password: string }) {
    const admin = await this.prisma.admin.findUnique({
      where: { email: dto.email },
    });

    if (!admin) throw new UnauthorizedException('Email veya şifre hatalı.');

    const valid = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!valid) throw new UnauthorizedException('Email veya şifre hatalı.');

    const token = this.jwt.sign(
      { sub: admin.id, type: 'admin' },
      { expiresIn: '7d' },
    );

    return { token, admin: { id: admin.id, email: admin.email } };
  }

  private async ensureUniqueSlug(base: string): Promise<string> {
    let slug = base;
    let i = 1;
    while (await this.prisma.restaurant.findUnique({ where: { slug } })) {
      slug = `${base}-${i++}`;
    }
    return slug;
  }
}
