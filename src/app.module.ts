import { Module } from '@nestjs/common';
import OConfigModule from '@/config/config.module';
import EventsModule from '@/common/events.gateway';
import Modules from '@/modules/index.module';

@Module({
  imports: [OConfigModule, EventsModule, Modules],
})
export default class AppModule { }
