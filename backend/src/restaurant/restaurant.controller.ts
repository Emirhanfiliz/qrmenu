import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, IsUrl } from 'class-validator';
import { ActiveRestaurantGuard } from '../auth/guards';
import { RestaurantService } from './restaurant.service';

class UpdateRestaurantDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsUrl() logoUrl?: string;
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

  @Get('stats')
  getStats(@Req() req: any) {
    return this.restaurantService.getStats(req.user.id);
  }
}
