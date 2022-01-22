import OConfigModule from '@config/config.module';
import { Module } from '@nestjs/common';
import FileController from './file.controller';

@Module({
  imports: [OConfigModule],
  controllers: [FileController],
})
export default class FileModule {}
