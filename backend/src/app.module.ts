import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { AnnouncementModule } from './announcement/announcement.module';
import { AuthModule } from './auth/auth.module';
import { CategoryModule } from './category/category.module';
import { MenuModule } from './menu/menu.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductModule } from './product/product.module';
import { RestaurantModule } from './restaurant/restaurant.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AdminModule,
    RestaurantModule,
    CategoryModule,
    ProductModule,
    AnnouncementModule,
    MenuModule,
  ],
})
export class AppModule {}
