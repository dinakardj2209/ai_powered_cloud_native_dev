import { io, Socket } from 'socket.io-client';
import { api } from './api';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      path: '/socket.io',
      auth: { token: api.getAccessToken() },
      autoConnect: true,
    });
  }
  return socket;
}

export function joinProject(projectId: string) {
  getSocket().emit('join:project', projectId);
}

export function leaveProject(projectId: string) {
  getSocket().emit('leave:project', projectId);
}
