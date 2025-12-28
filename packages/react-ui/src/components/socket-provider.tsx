import React, { useRef } from 'react';
import { useEffectOnce } from 'react-use';
import { io } from 'socket.io-client';
import { toast } from 'sonner';

import { API_BASE_URL } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

const socket = io(API_BASE_URL, {
  transports: ['websocket'],
  path: '/api/socket.io',
  autoConnect: false,
  reconnection: true,
});

const SocketContext = React.createContext<typeof socket>(socket);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const token = authenticationSession.getToken();
  const projectId = authenticationSession.getProjectId();
  const toastIdRef = useRef<string | null>(null);

  useEffectOnce(() => {
    if (token) {
      socket.auth = { token, projectId };
      if (!socket.connected) {
        socket.connect();

        socket.on('connect', () => {
          if (toastIdRef.current) {
            toast.dismiss(toastIdRef.current);
            toastIdRef.current = null;
          }
          console.log('connected to socket');
        });

        socket.on('disconnect', (reason) => {
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
        });
      }
    } else {
      socket.disconnect();
    }
  });

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => React.useContext(SocketContext);
