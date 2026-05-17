import { Controller, Get, HttpCode, Param, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
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

  @Get(':slug/og')
  async ogPage(@Param('slug') slug: string, @Res() res: Response) {
    const menuBase = process.env.MENU_BASE || 'http://localhost:5173';
    const menuUrl = `${menuBase}/${slug}`;
    const og = await this.menuService.getOgData(slug);

    const title = og ? `${og.name} - Menü` : 'Dijital Menü';
    const description = og?.tagline || 'QR kod ile dijital menümüze göz atın.';
    const image = og?.coverUrl || og?.logoUrl || '';

    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${menuUrl}">
  ${image ? `<meta property="og:image" content="${image}">` : ''}
  <meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  ${image ? `<meta name="twitter:image" content="${image}">` : ''}
  <meta http-equiv="refresh" content="0;url=${menuUrl}">
</head>
<body>
  <a href="${menuUrl}">Menüye git →</a>
  <script>window.location.replace('${menuUrl}');</script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.send(html);
  }
}
