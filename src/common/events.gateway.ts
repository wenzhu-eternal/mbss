import { RedisService } from '@liaoliaots/nestjs-redis';
import { Logger, Module } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import * as dayjs from 'dayjs';
import Redis from 'ioredis';
import { Socket } from 'socket.io';

import config from '@/config/config.default';

@WebSocketGateway({
  cors: { origin: config.allowOrigin },
})
class EventsGateway {
  private readonly redis: Redis;
  private readonly logger = new Logger(EventsGateway.name);

  constructor(private readonly redisService: RedisService) {
    this.redis = this.redisService.getOrThrow();
  }

  @SubscribeMessage('addSocket')
  async onAddSocket(
    @ConnectedSocket() { id }: Socket,
    @MessageBody() { userId }: { userId: number },
  ): Promise<void> {
    if (userId) {
      await this.redis.hset('socket', String(userId), JSON.stringify({ socketId: id }));
      this.logger.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ID为${userId}用户进行socket连接`);
    }
  }

  @SubscribeMessage('deleteSocket')
  async onDeleteSocket(_, @MessageBody() { userId }: { userId: number }): Promise<void> {
    if (userId) {
      await this.redis.hdel('socket', String(userId));
      this.logger.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ID为${userId}用户断开socket连接`);
    }
  }
}

@Module({
  providers: [EventsGateway],
})
export default class EventsModule {}
