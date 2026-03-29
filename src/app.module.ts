import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';

import EventsModule from '@/common/events.gateway';
import HttpExceptionFilter from '@/common/http-exception.filter';
import SanitizeMiddleware from '@/common/sanitize.middleware';
import OConfigModule from '@/config/config.module';
import Modules from '@/modules/index.module';
import ErrorLogService from '@/modules/services/errorLog';

@Module({
  imports: [
    OConfigModule,
    EventsModule,
    Modules,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
  ],
  providers: [
    {
      provide: APP_FILTER,
      useFactory: (errorLogService: ErrorLogService) => new HttpExceptionFilter(errorLogService),
      inject: [ErrorLogService],
    },
  ],
})
export default class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SanitizeMiddleware).forRoutes('*');
  }
}
