import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import { JwtService } from '@nestjs/jwt';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import AppModule from '@/app.module';
import config from '@/config/config.default';
import HttpExceptionFilter from '@/common/http-exception.filter';
import ResponseInterceptor from '@/common/response.interceptor';
import ValidationPipe from '@/common/validation.pipe';
import LoggerGlobal from '@/common/logger.middleware';
import AuthGuard from '@/common/auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      credentials: true,
      origin: config.allowOrigin,
      allowedHeaders: ['Content-Type', 'Accept'],
    },
  });

  app.setGlobalPrefix('api');

  app.use(LoggerGlobal);
  app.use(cookieParser());
  app.use(session(config.session));

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(new ValidationPipe());

  const reflector = app.get(JwtService);
  app.useGlobalGuards(new AuthGuard(reflector));

  const swaggerConfig = new DocumentBuilder()
    .setTitle(config.projectName)
    .setDescription('a pribate Middle and backstage service')
    .setVersion('1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-doc/', app, document);

  await app.listen(9000);
}
bootstrap();
