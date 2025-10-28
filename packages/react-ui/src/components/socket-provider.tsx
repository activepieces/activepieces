import React, { useEffect, useState } from 'react';
import { useEffectOnce } from 'react-use';
import { io } from 'socket.io-client';

import { API_BASE_URL } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

import { useToast } from './ui/use-toast';

const socket = io(API_BASE_URL, {
  transports: ['websocket'],
  path: '/api/socket.io',
  autoConnect: false,
  reconnection: true,
});

const SocketContext = React.createContext<typeof socket>(socket);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const token = authenticationSession.getToken();
  const [reconnecting, setReconnecting] = useState(false);
  const { dismiss, toast } = useToast();
  const [toastId, setToastId] = useState<string | null>(null);

  useEffectOnce(() => {
    if (token) {
      socket.auth = { token };
      if (!socket.connected) {
        socket.connect();

        socket.on('connect', () => {
          setReconnecting(false);
          console.log('connected to socket');
        });

        socket.on('disconnect', (reason) => {
          setReconnecting(true);
          if (reason === 'io server disconnect') {
            socket.connect();
          }
        });
      }
    } else {
      socket.disconnect();
    }
  });

  useEffect(() => {
    if (toastId) {
      dismiss(toastId);
      setToastId(null);
    } else if (reconnecting) {
      const { id } = toast({
        itemID: 'websocket-disconnected',
        title: 'Websocket Disconnected',
        description: 'Reconnecting...',
        duration: Infinity,
        variant: 'destructive',
      });
      setToastId(id);
    }
  }, [reconnecting]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => React.useContext(SocketContext);
