import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import * as request from 'supertest';
import AppModule from './../src/app.module';
import config from './../src/config/config.default';
import ValidationPipe from './../src/common/validation.pipe';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.use(session(config.session));
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('/user/login (POST) 应成功响应', () => {
    return request(app.getHttpServer())
      .post('/user/login')
      .send({ account: 'admin', password: '888888' })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });
  });
});
