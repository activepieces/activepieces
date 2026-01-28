import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

import { API_BASE_URL } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

const socket = io(API_BASE_URL, {
  transports: ['websocket'],
  path: '/api/socket.io',
  autoConnect: false,
  reconnection: true,
});

interface SocketContextValue {
  socket: Socket;
  connected: boolean;
}

const SocketContext = React.createContext<SocketContextValue>({
  socket,
  connected: false,
});

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const token = authenticationSession.getToken();
  const projectId = authenticationSession.getProjectId();
  const toastIdRef = useRef<string | null>(null);
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    if (token) {
      socket.auth = { token, projectId };
      if (!socket.connected) {
        socket.connect();
      }

      const handleConnect = () => {
        setConnected(true);
        if (toastIdRef.current) {
          toast.dismiss(toastIdRef.current);
          toastIdRef.current = null;
        }
        console.log('connected to socket');
      };

      const handleDisconnect = (reason: string) => {
        setConnected(false);
        if (!toastIdRef.current) {
          const id = toast('Connection Lost', {
            id: 'websocket-disconnected',
            description: 'We are trying to reconnect...',
            duration: Infinity,
          });
          toastIdRef.current = id?.toString() ?? null;
        }
        if (reason === 'io server disconnect') {
          socket.connect();
        }
      };

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);

      // Update initial state
      setConnected(socket.connected);

      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.disconnect();
      };
    } else {
      socket.disconnect();
      setConnected(false);
    }
  }, [token, projectId]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = React.useContext(SocketContext);
  return context.socket;
};

export const useSocketConnection = () => {
  const context = React.useContext(SocketContext);
  return context.connected;
};
