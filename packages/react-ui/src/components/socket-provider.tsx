import React from 'react';
import { useEffectOnce } from 'react-use';
import { io } from 'socket.io-client';

import { API_BASE_URL } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

import { Alert, AlertDescription } from './ui/alert';
import { LoadingSpinner } from './ui/spinner';

const socket = io(API_BASE_URL, {
  transports: ['websocket'],
  path: '/api/socket.io',
  autoConnect: false,
  reconnection: true,
});

const SocketContext = React.createContext<typeof socket>(socket);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const token = authenticationSession.getToken();

  useEffectOnce(() => {
    if (token) {
      socket.auth = { token };
      if (!socket.connected) {
        socket.connect();

        socket.on('connect', () => {
          console.log('connected to socket');
        });

        socket.on('disconnect', (reason) => {
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
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => React.useContext(SocketContext);
