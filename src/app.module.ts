import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { UserModule } from './user/user.module';
import { CreateuserModule } from './createuser/createuser.module';
import { ChatsModule } from './chats/chats.module';

@Module({
  imports: [AuthModule, ProductsModule, UserModule, CreateuserModule, ChatsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
