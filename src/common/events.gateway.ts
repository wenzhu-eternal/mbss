import { getAllowOrigin } from '@/config/proxy';
import UserModule from '@/modules/user/user.module';
import UserService from '@/modules/user/user.service';
import { Module } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: getAllowOrigin() },
})
class EvensGateway {
  constructor(private readonly userService: UserService) {}

  @SubscribeMessage('addSocket')
  onAddSocket(
    @ConnectedSocket() { id }: Socket,
    @MessageBody() { userId }: { userId: number },
  ): void {
    if (userId) this.userService.onSocketID(userId, id);
  }

  @SubscribeMessage('delectSocket')
  onDelectSocket(_, @MessageBody() { userId }: { userId: number }): void {
    if (userId) this.userService.onSocketID(userId);
  }
}

@Module({
  imports: [UserModule],
  providers: [EvensGateway],
})
export default class EventsModule {}
