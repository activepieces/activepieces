import React, { useEffect, useState } from 'react';
import { useEffectOnce } from 'react-use';
import { io } from 'socket.io-client';

import { API_BASE_URL } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { Alert, AlertDescription } from './ui/alert';
import { LoadingSpinner } from './ui/spinner';
import { isNil } from '@activepieces/shared';

const socket = io(API_BASE_URL, {
  transports: ['websocket'],
  path: '/api/socket.io',
  autoConnect: false,
});

const SocketContext = React.createContext<typeof socket>(socket);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const token = authenticationSession.getToken();
  const [reconnectInterval, setReconnectInterval] = useState<NodeJS.Timeout | null>(null);
  const [disconnected, setDisconnected] = useState<boolean>(false);

  useEffectOnce(() => {
    if (token) {
      socket.auth = { token };
      if (!socket.connected) {
        socket.connect();

        socket.on('connect', () => {
          console.log("connected to socket")
          setDisconnected(false);
        })

        socket.on('disconnect', () => {
          console.log("disconnected from socket")
          setDisconnected(true);
        })

      }
    } else {
      socket.disconnect();
    }
  });

  useEffect(() => {
    if (disconnected) {
      const interval = setInterval(() => {
        socket.connect();
      }, 1000)
      setReconnectInterval(interval)
      return () => clearInterval(interval)
    }
    if (!isNil(reconnectInterval)) {
      clearInterval(reconnectInterval)
    }
  }, [disconnected]);

  return (
    <SocketContext.Provider value={socket}>
      {disconnected && (
        <Alert className="fixed bottom-10 right-10 w-96 z-50 bg-background items-center" variant="destructive" >
          <LoadingSpinner />
          <AlertDescription>Websocket Disconnected, reconnecting...</AlertDescription>
        </Alert>
      )}
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => React.useContext(SocketContext);
