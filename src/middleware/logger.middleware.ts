import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    
    this.logger.log(`${method} ${originalUrl}`);
    
    next();
  }
} 
//para ver en la consola de nestjs el log de las peticiones
//se debe agregar en el main.ts
//import { LoggerMiddleware } from './middleware/logger.middleware';
//app.use(LoggerMiddleware);
//y en el middleware
//import { LoggerMiddleware } from './middleware/logger.middleware';
//import { NestMiddleware } from '@nestjs/common';
//import { Request, Response, NextFunction } from 'express';
//import { Logger } from '@nestjs/common';