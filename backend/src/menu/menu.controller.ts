import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { MenuService } from './menu.service';

@Controller('menu')
export class MenuController {
  constructor(private menuService: MenuService) {}

  @Get(':slug')
  getMenu(@Param('slug') slug: string) {
    return this.menuService.getMenu(slug);
  }

  @Post(':slug/scan')
  @HttpCode(204)
  recordScan(@Param('slug') slug: string) {
    return this.menuService.recordScan(slug);
  }
}
