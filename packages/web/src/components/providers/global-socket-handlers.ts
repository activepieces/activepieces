import { Socket } from 'socket.io-client';

export function registerGlobalSocketHandlers(_socket: Socket): () => void {
  return () => {
    // cleanup
  };
}
