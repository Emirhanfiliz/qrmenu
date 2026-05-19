import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as crypto from 'crypto';
import * as fs from 'fs';
import sharp = require('sharp');
import { ActiveRestaurantGuard } from '../auth/guards';

@UseGuards(ActiveRestaurantGuard)
@Controller('upload')
export class UploadController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: path.join(process.cwd(), 'uploads'),
        filename: (_, file, cb) => {
          cb(null, crypto.randomUUID() + path.extname(file.originalname).toLowerCase());
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_, file, cb) => {
        const allowedExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
        const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedExt.includes(ext) && allowedMime.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Sadece resim dosyaları yüklenebilir.'), false);
        }
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Dosya bulunamadı.');

    const uploadsDir = path.join(process.cwd(), 'uploads');
    const outName = crypto.randomUUID() + '.webp';
    const outPath = path.join(uploadsDir, outName);

    await sharp(file.path)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(outPath);

    fs.unlinkSync(file.path);

    const appUrl = process.env.APP_URL || 'http://localhost:3001';
    return { url: `${appUrl}/uploads/${outName}` };
  }
}
