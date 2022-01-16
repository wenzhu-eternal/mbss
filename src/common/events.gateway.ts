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
    @MessageBody() { token }: { token: string },
  ): void {
    this.userService.onSocketID(token, id);
  }

  @SubscribeMessage('delectSocket')
  onDelectSocket(_, @MessageBody() { token }: { token: string }): void {
    this.userService.onSocketID(token);
  }
}

@Module({
  imports: [UserModule],
  providers: [EvensGateway],
})
export default class EventsModule {}
