import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { RestaurantStatus, SubscriptionType } from '@prisma/client';
import { IsEnum } from 'class-validator';
import { AdminGuard } from '../auth/guards';
import { AdminService } from './admin.service';

class ApproveDto {
  @IsEnum(SubscriptionType) type: SubscriptionType;
}

@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('restaurants')
  getRestaurants(@Query('status') status?: RestaurantStatus) {
    return this.adminService.getRestaurants(status);
  }

  @Patch('restaurants/:id/approve')
  approve(@Param('id') id: string, @Body() dto: ApproveDto) {
    return this.adminService.approveAndSubscribe(id, dto.type);
  }

  @Patch('restaurants/:id/renew')
  renew(@Param('id') id: string, @Body() dto: ApproveDto) {
    return this.adminService.renewSubscription(id, dto.type);
  }

  @Patch('restaurants/:id/suspend')
  suspend(@Param('id') id: string) {
    return this.adminService.suspendRestaurant(id);
  }
}
