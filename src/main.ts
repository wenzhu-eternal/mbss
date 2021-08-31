import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@common/http-exception.filter';
import { ResponseInterceptor } from '@common/response.interceptor';
import { AuthGuard } from '@common/auth.guard';
import { UserService } from '@modules/user/user.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: ['http://localhost:3001'],
      allowedHeaders: ['Content-Type', 'Accept', 'x-auth-token'],
      exposedHeaders: ['x-auth-token'],
    }
  });

  app.setGlobalPrefix('api');

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const reflector = app.get(UserService);
  app.useGlobalGuards(new AuthGuard(reflector));

  const config = new DocumentBuilder()
    .setTitle('mbss')
    .setDescription('a pribate Middle and backstage service')
    .setVersion('0.0.1')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-doc/', app, document);

  await app.listen(3000);
}
bootstrap();
