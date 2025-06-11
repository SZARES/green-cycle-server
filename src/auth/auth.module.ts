import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UserModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'tu_clave_secreta_super_segura',
      signOptions: { expiresIn: '24h' },
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, UserService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
