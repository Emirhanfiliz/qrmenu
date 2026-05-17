import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { IsInt, IsOptional, IsString, IsUrl, Min } from 'class-validator';
import { ActiveRestaurantGuard } from '../auth/guards';
import { CategoryService } from './category.service';

class CreateCategoryDto {
  @IsString() name: string;
  @IsOptional() @IsUrl() imageUrl?: string;
}

class UpdateCategoryDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsUrl() imageUrl?: string;
  @IsOptional() @IsInt() @Min(0) order?: number;
}

@UseGuards(ActiveRestaurantGuard)
@Controller('categories')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Get()
  list(@Req() req: any) {
    return this.categoryService.list(req.user.id);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateCategoryDto) {
    return this.categoryService.create(req.user.id, dto);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoryService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.categoryService.remove(req.user.id, id);
  }
}
