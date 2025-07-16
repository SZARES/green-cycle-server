import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product, ProductSchema } from './entities/product.entity';
import { UploadModule } from '../upload/upload.module';
import { CategoriesService } from 'src/categories/categories.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    UploadModule
  ],
  controllers: [ProductsController],
  providers: [ProductsService, CategoriesService],
  exports: [ProductsService, CategoriesService]
})
export class ProductsModule {}
