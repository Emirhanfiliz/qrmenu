import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private email: EmailService,
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
    const code = generateCode();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 saat

    await this.prisma.restaurant.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        slug: uniqueSlug,
        emailVerificationToken: code,
        emailVerificationExpires: expires,
      },
    });

    await this.email.sendVerificationEmail(dto.email, code);

    return { message: 'Kayıt başarılı. Email adresinize doğrulama kodu gönderildi.' };
  }

  async verifyEmail(restaurantId: string, code: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) throw new BadRequestException('Geçersiz istek.');
    if (restaurant.emailVerifiedAt) return { message: 'Email zaten doğrulanmış.' };

    if (
      restaurant.emailVerificationToken !== code ||
      !restaurant.emailVerificationExpires ||
      restaurant.emailVerificationExpires < new Date()
    ) {
      throw new BadRequestException('Kod hatalı veya süresi dolmuş.');
    }

    await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    return { message: 'Email adresiniz doğrulandı.' };
  }

  async resendVerification(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) throw new BadRequestException('Geçersiz istek.');
    if (restaurant.emailVerifiedAt) throw new BadRequestException('Email zaten doğrulanmış.');

    // Önceki kod gönderilmişse 1 dk bekleme zorunluluğu
    if (
      restaurant.emailVerificationExpires &&
      restaurant.emailVerificationExpires.getTime() > Date.now() + 59 * 60 * 1000
    ) {
      throw new BadRequestException('Çok sık deneme. 1 dakika bekleyin.');
    }

    const code = generateCode();
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: { emailVerificationToken: code, emailVerificationExpires: expires },
    });

    await this.email.sendVerificationEmail(restaurant.email, code);

    return { message: 'Doğrulama kodu tekrar gönderildi.' };
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
        slug: restaurant.slug,
        email: restaurant.email,
        status: restaurant.status,
        emailVerifiedAt: restaurant.emailVerifiedAt,
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
