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

  // Tracks online users per group room: Map<groupId, Map<socketId, { userId: string, username: string }>>
  private readonly roomOnlineUsers = new Map<
    string,
    Map<string, { userId: string; username: string }>
  >();

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

    // Remove client from all room presence tracking
    this.roomOnlineUsers.forEach((usersMap, groupId) => {
      if (usersMap.has(client.id)) {
        usersMap.delete(client.id);
        this.broadcastOnlineUsers(groupId);
      }
    });
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string },
  ) {
    if (data?.groupId) {
      const roomName = `group:${data.groupId}`;
      client.join(roomName);

      const user = client.data.user;
      if (user) {
        if (!this.roomOnlineUsers.has(data.groupId)) {
          this.roomOnlineUsers.set(data.groupId, new Map());
        }
        const userMap = this.roomOnlineUsers.get(data.groupId)!;
        userMap.set(client.id, {
          userId: user.sub || user.id,
          username: user.username,
        });

        this.broadcastOnlineUsers(data.groupId);
      }

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

      if (this.roomOnlineUsers.has(data.groupId)) {
        const userMap = this.roomOnlineUsers.get(data.groupId)!;
        userMap.delete(client.id);
        this.broadcastOnlineUsers(data.groupId);
      }

      this.logger.log(`Socket ${client.id} left room ${roomName}`);
      return { status: 'left', room: roomName };
    }
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string },
  ) {
    if (data?.groupId && client.data.user) {
      const roomName = `group:${data.groupId}`;
      client.to(roomName).emit('userTyping', {
        groupId: data.groupId,
        userId: client.data.user.sub || client.data.user.id,
        username: client.data.user.username,
        isTyping: true,
      });
    }
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string },
  ) {
    if (data?.groupId && client.data.user) {
      const roomName = `group:${data.groupId}`;
      client.to(roomName).emit('userTyping', {
        groupId: data.groupId,
        userId: client.data.user.sub || client.data.user.id,
        username: client.data.user.username,
        isTyping: false,
      });
    }
  }

  broadcastMessage(groupId: string, message: any) {
    const roomName = `group:${groupId}`;
    this.server.to(roomName).emit('newMessage', message);
    this.logger.log(`Broadcasted new message to room ${roomName}`);
  }

  broadcastMessageUpdate(groupId: string, message: any) {
    const roomName = `group:${groupId}`;
    this.server.to(roomName).emit('messageUpdated', message);
    this.logger.log(`Broadcasted message update to room ${roomName}`);
  }

  broadcastMessageDelete(groupId: string, messageId: string) {
    const roomName = `group:${groupId}`;
    this.server.to(roomName).emit('messageDeleted', { messageId, groupId });
    this.logger.log(`Broadcasted message deletion to room ${roomName}`);
  }

  private broadcastOnlineUsers(groupId: string) {
    const roomName = `group:${groupId}`;
    const userMap = this.roomOnlineUsers.get(groupId);

    const onlineUsersList = userMap
      ? Array.from(
          new Map(
            Array.from(userMap.values()).map((u) => [u.userId, u]),
          ).values(),
        )
      : [];

    this.server.to(roomName).emit('onlineUsers', {
      groupId,
      users: onlineUsersList,
    });
  }
}
