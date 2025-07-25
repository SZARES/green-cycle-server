import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configuración de helmet para API REST - CSP estricto
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"], // Bloquear todo por defecto
        scriptSrc: ["'none'"], // No scripts necesarios en API
        styleSrc: ["'none'"], // No estilos necesarios en API - elimina 'unsafe-inline'
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"], // Solo Cloudinary para imágenes
        connectSrc: ["'self'"], // Solo conexiones al mismo origen
        fontSrc: ["'none'"], // No fuentes necesarias en API
        objectSrc: ["'none'"], // No objetos embebidos
        mediaSrc: ["'none'"], // No media necesaria en API
        frameSrc: ["'none'"], // No frames en API
        childSrc: ["'none'"], // No child sources
        manifestSrc: ["'none'"], // No manifest necesario
        baseUri: ["'self'"], // Solo base URI del mismo origen
        formAction: ["'self'"], // Solo formularios al mismo origen
      },
    },
    crossOriginEmbedderPolicy: false, // Mantener CORS funcionando
    hsts: {
      maxAge: 31536000, // HTTPS Strict Transport Security por 1 año
      includeSubDomains: true,
      preload: true
    },
  }));

  // Configuración segura de CORS con dominios específicos
  app.enableCors({
    origin: [
      'https://green-cycle-connect-share.lovable.app', // Frontend en producción
      'http://localhost:8080', // Frontend en desarrollo
      'http://localhost:3000', // Backup para desarrollo común
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization, Accept, Origin, X-Requested-With',
    optionsSuccessStatus: 200, // Para compatibilidad con navegadores legacy
  });
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
