import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { IsBoolean, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { ActiveRestaurantGuard } from '../auth/guards';
import { RestaurantService } from './restaurant.service';

class UpdateRestaurantDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() logoUrl?: string;
}

class UpdateDesignDto {
  @IsOptional() @IsIn(['beach', 'new21']) theme?: string;
  @IsOptional() @IsString() tagline?: string;
  @IsOptional() @IsString() coverUrl?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() workingHours?: string;
  @IsOptional() @IsString() wifiInfo?: string;
  @IsOptional() @IsBoolean() showWelcome?: boolean;
}

class ChangePasswordDto {
  @IsString() currentPassword: string;
  @IsString() @MinLength(6) newPassword: string;
}

@UseGuards(ActiveRestaurantGuard)
@Controller('restaurant')
export class RestaurantController {
  constructor(private restaurantService: RestaurantService) {}

  @Get('me')
  getMe(@Req() req: any) {
    return this.restaurantService.getMe(req.user.id);
  }

  @Patch('me')
  updateMe(@Req() req: any, @Body() dto: UpdateRestaurantDto) {
    return this.restaurantService.updateMe(req.user.id, dto);
  }

  @Post('change-password')
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.restaurantService.changePassword(req.user.id, dto);
  }

  @Get('design')
  getDesign(@Req() req: any) {
    return this.restaurantService.getDesign(req.user.id);
  }

  @Patch('design')
  updateDesign(@Req() req: any, @Body() dto: UpdateDesignDto) {
    return this.restaurantService.updateDesign(req.user.id, dto);
  }

  @Get('stats')
  getStats(@Req() req: any) {
    return this.restaurantService.getStats(req.user.id);
  }
}
