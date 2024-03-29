import config from '@/config/config.default';
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

@WebSocketGateway({
  cors: { origin: config.allowOrigin },
})
class EvensGateway {
  private readonly redis: Redis;

  constructor(private readonly redisService: RedisService) {
    this.redis = this.redisService.getClient();
  }

  @SubscribeMessage('addSocket')
  onAddSocket(
    @ConnectedSocket() { id }: Socket,
    @MessageBody() { userId }: { userId: number },
  ): void {
    if (userId) {
      this.redis.hset('socket', {
        [userId]: JSON.stringify({ socketId: id }),
      });
      Logger.log(
        `[${dayjs().format(
          'YYYY-MM-DD HH:mm:ss',
        )}] ID为${userId}用户进行socket连接`,
      );
    }
  }

  @SubscribeMessage('delectSocket')
  onDelectSocket(_, @MessageBody() { userId }: { userId: number }): void {
    if (userId) {
      this.redis.hdel('socket', String(userId));
      Logger.log(
        `[${dayjs().format(
          'YYYY-MM-DD HH:mm:ss',
        )}] ID为${userId}用户断开socket连接`,
      );
    }
  }
}

@Module({
  providers: [EvensGateway],
})
export default class EventsModule {}
