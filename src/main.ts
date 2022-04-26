import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import { JwtService } from '@nestjs/jwt';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import AppModule from '@/app.module';
import { getAllowOrigin } from '@/config/proxy';
import HttpExceptionFilter from '@/common/http-exception.filter';
import ResponseInterceptor from '@/common/response.interceptor';
import ValidationPipe from '@/common/validation.pipe';
import LoggerGlobal from '@/common/logger.middleware';
import AuthGuard from '@/common/auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      credentials: true,
      origin: getAllowOrigin(),
      allowedHeaders: ['Content-Type', 'Accept'],
    },
  });

  app.setGlobalPrefix('api');

  app.use(LoggerGlobal);
  app.use(cookieParser());
  app.use(
    session({
      secret: 'mbss',
      resave: false,
      saveUninitialized: false,
    }),
  );

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(new ValidationPipe());

  const reflector = app.get(JwtService);
  app.useGlobalGuards(new AuthGuard(reflector));

  const config = new DocumentBuilder()
    .setTitle('mbss')
    .setDescription('a pribate Middle and backstage service')
    .setVersion('0.0.1')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-doc/', app, document);

  await app.listen(9000);
}
bootstrap();
