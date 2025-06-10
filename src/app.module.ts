import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { UserModule } from './user/user.module';
import { ChatsModule } from './chats/chats.module';
import { getMongoConfig } from './CONFIGURATION';
import { CategoriesModule } from './categories/categories.module';
import { SeederModule } from './seeder/seeder.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      useFactory: getMongoConfig,
    }),
    AuthModule,
    ProductsModule,
    UserModule,
    ChatsModule,
    CategoriesModule,
    SeederModule,
    OrdersModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
