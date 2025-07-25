import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
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
import { UploadModule } from './upload/upload.module';
import { CartModule } from './cart/cart.module';
import { BackupModule } from './backup/backup.module';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { ThrottlerExceptionFilter } from './common/filters/throttler-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    // Configuración de throttling global
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000, // 1 minuto
          limit: 20, // 20 requests por minuto por IP
        },
      ],
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
    OrdersModule,
    UploadModule,
    CartModule,
    BackupModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Aplicar throttling globalmente
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Aplicar filtro de excepciones de throttling globalmente
    {
      provide: APP_FILTER,
      useClass: ThrottlerExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
