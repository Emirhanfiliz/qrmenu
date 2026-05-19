import { BadRequestException, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import * as path from 'path';
import { ActiveRestaurantGuard } from '../auth/guards';
import { ImportService } from './import.service';

@UseGuards(ActiveRestaurantGuard)
@Controller('import')
export class ImportController {
  constructor(private importService: ImportService) {}

  @Post('menu-photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
        const allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext) && allowedMime.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Sadece resim dosyaları yüklenebilir.'), false);
        }
      },
    }),
  )
  async analyzeMenuPhoto(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Dosya bulunamadı.');
    return this.importService.analyzeMenuPhoto(file.buffer);
  }
}
