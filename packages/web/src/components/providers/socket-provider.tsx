import React, { useEffect, useRef } from 'react';
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

  useEffect(() => {
    const dismissConnectionLostToast = () => {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
      console.log('connected to socket');
    };
    const showConnectionLostToast = (reason: string) => {
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
    if (token) {
      socket.auth = { token, projectId };
      if (!socket.connected) {
        socket.connect();
        socket.on('connect', dismissConnectionLostToast);
        socket.on('disconnect', showConnectionLostToast);
      }
    } else {
      socket.disconnect();
    }
    return () => {
      socket.off('connect', dismissConnectionLostToast);
      socket.off('disconnect', showConnectionLostToast);
      socket.disconnect();
    };
  }, [token, projectId]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => React.useContext(SocketContext);
