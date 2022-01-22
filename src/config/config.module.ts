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
      useFactory: (config: ConfigService) => config.get('database'),
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => config.get('jwtSecret'),
      inject: [ConfigService],
    }),
    MulterModule.registerAsync({
      useFactory: (config: ConfigService) => config.get('file'),
      inject: [ConfigService],
    }),
  ],
  exports: [JwtModule, MulterModule],
})
export default class OConfigModule {}
