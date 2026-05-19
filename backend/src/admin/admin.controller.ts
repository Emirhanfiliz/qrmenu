import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { RestaurantStatus, SubscriptionType } from '@prisma/client';
import { IsEnum } from 'class-validator';
import type { Request } from 'express';
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
  approve(@Param('id') id: string, @Body() dto: ApproveDto, @Req() req: Request) {
    const admin = req.user as { sub: string };
    return this.adminService.approveAndSubscribe(id, dto.type, admin.sub);
  }

  @Patch('restaurants/:id/renew')
  renew(@Param('id') id: string, @Body() dto: ApproveDto, @Req() req: Request) {
    const admin = req.user as { sub: string };
    return this.adminService.renewSubscription(id, dto.type, admin.sub);
  }

  @Patch('restaurants/:id/suspend')
  suspend(@Param('id') id: string, @Req() req: Request) {
    const admin = req.user as { sub: string };
    return this.adminService.suspendRestaurant(id, admin.sub);
  }

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('logs')
  getLogs(@Query('page') page?: string) {
    return this.adminService.getLogs(Number(page) || 1);
  }

  @Get('restaurants/:id')
  getRestaurantDetail(@Param('id') id: string) {
    return this.adminService.getRestaurantDetail(id);
  }
}
