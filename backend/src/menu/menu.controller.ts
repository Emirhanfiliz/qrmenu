import { Controller, Get, Param } from '@nestjs/common';
import { MenuService } from './menu.service';

@Controller('menu')
export class MenuController {
  constructor(private menuService: MenuService) {}

  @Get(':slug')
  getMenu(@Param('slug') slug: string) {
    return this.menuService.getMenu(slug);
  }
}
