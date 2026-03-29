import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import * as session from 'express-session';

dotenv.config();

import AppModule from '@/app.module';
import { createApiRoutesJson } from '@/common/apiRoutes';
import AuthGuard from '@/common/auth.guard';
import LoggerGlobal from '@/common/logger.middleware';
import ResponseInterceptor from '@/common/response.interceptor';
import SanitizePipe from '@/common/sanitize.pipe';
import ValidationPipe from '@/common/validation.pipe';
import config from '@/config/config.default';
import AuthService from '@/modules/services/auth';

function validateRequiredConfig(): void {
  const requiredEnvVars = [
    { key: 'JWT_SECRET', value: process.env.JWT_SECRET },
    { key: 'SESSION_SECRET', value: process.env.SESSION_SECRET },
  ];

  const missingVars = requiredEnvVars.filter(item => !item.value || item.value.trim() === '');

  if (missingVars.length > 0) {
    const missingKeys = missingVars.map(item => item.key).join(', ');
    console.error(`\n❌ 错误：缺少必要的环境变量配置: ${missingKeys}`);
    console.error('请在 .env 文件中配置这些环境变量后再启动应用。\n');
    process.exit(1);
  }
}

async function bootstrap() {
  validateRequiredConfig();

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
  app.useGlobalPipes(new ValidationPipe(), new SanitizePipe());

  const reflector = app.get(AuthService);
  app.useGlobalGuards(new AuthGuard(reflector));

  const swaggerConfig = new DocumentBuilder()
    .setTitle(String(config.projectName || 'Mbss API'))
    .setDescription('a pribate Middle and backstage service')
    .setVersion('1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-doc/', app, document);

  await app.listen(9000);

  createApiRoutesJson(app);
}
bootstrap().catch(error => {
  console.error('Application startup failed:', error);
  process.exit(1);
});
