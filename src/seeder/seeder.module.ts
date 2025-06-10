import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeederController } from './seeder.controller';
import { SeederService } from './seeder.service';
import { Category, CategorySchema } from '../categories/entities/category.entity';
import { Product, ProductSchema } from '../products/entities/product.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [SeederController],
  providers: [SeederService],
})
export class SeederModule {} 