import { RedisModule } from '@liaoliaots/nestjs-redis';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from 'nestjs-config';
import { resolve } from 'path';

@Module({
  imports: [
    ConfigModule.load(resolve(__dirname, '**/!(*.d).{ts,js}')),
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => config.get('config.default').mysql,
      inject: [ConfigService],
    }),
    RedisModule.forRootAsync({
      useFactory: (config: ConfigService) => config.get('config.default').redis,
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) =>
        config.get('config.default').jwtSecret,
      inject: [ConfigService],
    }),
    MulterModule.registerAsync({
      useFactory: (config: ConfigService) => config.get('config.default').file,
      inject: [ConfigService],
    }),
    HttpModule.register({}),
  ],
  exports: [JwtModule, MulterModule, HttpModule],
})
export default class OConfigModule {}
