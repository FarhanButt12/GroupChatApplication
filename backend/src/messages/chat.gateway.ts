import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const authHeader =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization;

      if (!authHeader) {
        this.logger.warn(`Connection rejected: Missing token for socket ${client.id}`);
        client.disconnect();
        return;
      }

      const token = authHeader.replace(/^Bearer\s+/i, '');
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = await this.jwtService.verifyAsync(token, { secret });

      client.data.user = payload;
      this.logger.log(`Client connected: ${client.id} (User: ${payload.username})`);
    } catch (error) {
      this.logger.error(
        `Connection authentication failed for socket ${client.id}: ${error.message}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string },
  ) {
    if (data?.groupId) {
      const roomName = `group:${data.groupId}`;
      client.join(roomName);
      this.logger.log(`Socket ${client.id} joined room ${roomName}`);
      return { status: 'joined', room: roomName };
    }
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string },
  ) {
    if (data?.groupId) {
      const roomName = `group:${data.groupId}`;
      client.leave(roomName);
      this.logger.log(`Socket ${client.id} left room ${roomName}`);
      return { status: 'left', room: roomName };
    }
  }

  broadcastMessage(groupId: string, message: any) {
    const roomName = `group:${groupId}`;
    this.server.to(roomName).emit('newMessage', message);
    this.logger.log(`Broadcasted new message to room ${roomName}`);
  }
}
