import { Module } from '@nestjs/common';
import { OConfigModule } from '@config/config.module';
import { Modules } from '@modules/index.module';

@Module({
  imports: [OConfigModule, Modules],
})
export class AppModule { }
