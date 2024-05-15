import { Injectable } from '@angular/core';
import { Socket, SocketIoConfig } from 'ngx-socket-io';
import { environment } from '../environments/environment';
import { AuthenticationService } from './authentication.service';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  socket: Socket;
  constructor(private authenticationService: AuthenticationService) {}

  connect() {
    this.socket = new Socket(this.getSocketIoConfig());
    this.socket.connect();
  }

  disconnect() {
    this.socket.disconnect();
  }

  getSocketIoConfig(): SocketIoConfig {
    return {
      url: resolveSocketUrl(environment.apiUrl),
      options: {
        transports: ['websocket'],
        auth: {
          token: this.authenticationService.getToken(),
        },
      },
    };
  }
}

function resolveSocketUrl(url: string): string {
  const isRelative = url.startsWith('/');

  if (isRelative) {
    const urlCon = new URL(url, window.location.href).href;
    return urlCon
      .replace('https', 'wss')
      .replace('http', 'ws')
      .split('/api')[0];
  }

  return url.split('/v1')[0].replace('http', 'ws');
}
