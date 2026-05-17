import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ActiveRestaurantGuard } from '../auth/guards';
import { AnnouncementService } from './announcement.service';

class CreateAnnouncementDto {
  @IsString() title: string;
  @IsString() body: string;
  @IsOptional() @IsString() imageUrl?: string;
}

class UpdateAnnouncementDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() body?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

@UseGuards(ActiveRestaurantGuard)
@Controller('announcements')
export class AnnouncementController {
  constructor(private announcementService: AnnouncementService) {}

  @Get()
  list(@Req() req: any) {
    return this.announcementService.list(req.user.id);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateAnnouncementDto) {
    return this.announcementService.create(req.user.id, dto);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateAnnouncementDto) {
    return this.announcementService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.announcementService.remove(req.user.id, id);
  }
}
