import * as dotenv from 'dotenv';

dotenv.config();

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import AppModule from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  }, 30000);

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/api (GET) - should return 200', () => {
    return request(app.getHttpServer()).get('/api').expect(200);
  });
});
