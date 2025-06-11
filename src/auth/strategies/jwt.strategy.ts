import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../../user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    console.log("payload", payload);
    console.log("payload.sub", payload.sub);
    try {
      const user = await this.userService.findOne(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }
      return { id: payload.sub, email: payload.email };
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }
} 