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
          const ext = path.extname(file.originalname).toLowerCase();
          cb(null, crypto.randomUUID() + ext);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
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
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Dosya bulunamadı.');
    const appUrl = process.env.APP_URL || 'http://localhost:3001';
    return { url: `${appUrl}/uploads/${file.filename}` };
  }
}
