import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/runs' })
export class RunLogsGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('join-run')
  handleJoinRun(@MessageBody() runId: string, @ConnectedSocket() client: Socket) {
    client.join(`run:${runId}`);
    return { joined: runId };
  }

  @SubscribeMessage('leave-run')
  handleLeaveRun(@MessageBody() runId: string, @ConnectedSocket() client: Socket) {
    client.leave(`run:${runId}`);
    return { left: runId };
  }

  emitLogAppended(runId: string, log: { id: string; runId: string; level: string; message: string; createdAt: string }) {
    this.server.to(`run:${runId}`).emit('run-log-appended', log);
  }

  emitStatusUpdated(runId: string, status: string) {
    this.server.to(`run:${runId}`).emit('run-status-updated', { runId, status });
  }
}
