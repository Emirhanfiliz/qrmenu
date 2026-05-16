import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RestaurantStatus } from '@prisma/client';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class RestaurantGuard extends AuthGuard('jwt') implements CanActivate {
  handleRequest(err: any, user: any) {
    if (err || !user) throw new UnauthorizedException();
    if (user.type !== 'restaurant') throw new ForbiddenException();
    return user;
  }
}

@Injectable()
export class ActiveRestaurantGuard extends AuthGuard('jwt') implements CanActivate {
  handleRequest(err: any, user: any) {
    if (err || !user) throw new UnauthorizedException();
    if (user.type !== 'restaurant') throw new ForbiddenException();
    if (user.status !== RestaurantStatus.ACTIVE) {
      throw new ForbiddenException('Hesabınız henüz onaylanmamış veya aboneliğiniz sona ermiş.');
    }

    const sub = user.subscription;
    if (!sub || new Date(sub.endsAt) < new Date()) {
      throw new ForbiddenException('Aboneliğiniz sona ermiş.');
    }

    return user;
  }
}

@Injectable()
export class AdminGuard extends AuthGuard('jwt') implements CanActivate {
  handleRequest(err: any, user: any) {
    if (err || !user) throw new UnauthorizedException();
    if (user.type !== 'admin') throw new ForbiddenException();
    return user;
  }
}
