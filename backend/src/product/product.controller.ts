import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, IsUrl, Min } from 'class-validator';
import { ActiveRestaurantGuard } from '../auth/guards';
import { ProductService } from './product.service';

class CreateProductDto {
  @IsString() categoryId: string;
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsNumber() @Min(0) @Type(() => Number) price: number;
  @IsOptional() @IsUrl() imageUrl?: string;
  @IsOptional() @IsBoolean() isAvailable?: boolean;
}

class UpdateProductDto {
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) price?: number;
  @IsOptional() @IsUrl() imageUrl?: string;
  @IsOptional() @IsBoolean() isAvailable?: boolean;
  @IsOptional() @IsInt() @Min(0) order?: number;
}

@UseGuards(ActiveRestaurantGuard)
@Controller('products')
export class ProductController {
  constructor(private productService: ProductService) {}

  @Get()
  list(@Req() req: any, @Query('categoryId') categoryId?: string) {
    return this.productService.list(req.user.id, categoryId);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateProductDto) {
    return this.productService.create(req.user.id, dto);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.productService.remove(req.user.id, id);
  }
}
