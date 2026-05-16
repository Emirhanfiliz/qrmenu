import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

export type JwtPayload = {
  sub: string;
  type: 'restaurant' | 'admin';
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.type === 'restaurant') {
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: payload.sub },
        include: { subscription: true },
      });
      if (!restaurant) throw new UnauthorizedException();
      return { ...restaurant, type: 'restaurant' };
    }

    if (payload.type === 'admin') {
      const admin = await this.prisma.admin.findUnique({
        where: { id: payload.sub },
      });
      if (!admin) throw new UnauthorizedException();
      return { ...admin, type: 'admin' };
    }

    throw new UnauthorizedException();
  }
}
