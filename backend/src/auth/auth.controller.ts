import { Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { IsEmail, IsString, Length, Matches, MinLength } from 'class-validator';
import { RestaurantGuard } from './guards';
import { AuthService } from './auth.service';
import type { Request } from 'express';

class RegisterDto {
  @IsString() name: string;
  @IsEmail() email: string;
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Şifre en az 8 karakter, bir büyük harf, bir küçük harf ve bir rakam içermelidir.',
  })
  password: string;
}

class LoginDto {
  @IsEmail() email: string;
  @IsString() password: string;
}

class VerifyEmailDto {
  @IsString() @Length(6, 6) token: string;
}

@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  register(@Body() dto: RegisterDto) {
    return this.auth.registerRestaurant(dto);
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  login(@Body() dto: LoginDto) {
    return this.auth.loginRestaurant(dto);
  }

  @Post('admin/login')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  adminLogin(@Body() dto: LoginDto) {
    return this.auth.loginAdmin(dto);
  }

  @Post('verify-email')
  @HttpCode(200)
  @UseGuards(RestaurantGuard)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  verifyEmail(@Body() dto: VerifyEmailDto, @Req() req: Request) {
    const user = req.user as { sub: string };
    return this.auth.verifyEmail(user.sub, dto.token);
  }

  @Post('resend-verification')
  @HttpCode(200)
  @UseGuards(RestaurantGuard)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  resendVerification(@Req() req: Request) {
    const user = req.user as { sub: string };
    return this.auth.resendVerification(user.sub);
  }
}
