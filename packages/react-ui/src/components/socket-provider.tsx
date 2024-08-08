import React, { useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { useLocalStorage } from 'react-use';

// Initialize the socket but don't auto-connect
const socket = io(API_BASE_URL, {
  transports: ['websocket'],
  path: '/api/socket.io',
  autoConnect: false,
});

const SocketContext = React.createContext<typeof socket>(socket);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState(authenticationSession.getToken());

  React.useEffect(() => {
    if (token) {
      socket.auth = { token };
      if (!socket.connected) {
        socket.connect();
      }
    } else {
      socket.disconnect();
    }

    socket.on('connect', () => {
      console.log('connected');
    });

    socket.on('disconnect', (error) => {
      console.log('disconnected');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [token]);

  React.useEffect(() => {
    const handleStorageChange = () => {
      const newToken = authenticationSession.getToken();
      if (newToken !== token) {
        setToken(newToken);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [token, setToken]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => React.useContext(SocketContext);
