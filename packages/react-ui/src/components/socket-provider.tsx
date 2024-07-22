import React from 'react';
import { io } from 'socket.io-client';

import { authenticationSession } from '@/lib/authentication-session';

// TODO change and handle when the user is not logged in.
const url = 'https://cloud.activepieces.com';

const socket = io(url, {
  transports: ['websocket'],
  path: '/api/socket.io',
  auth: (cb) => {
    cb({
      token: authenticationSession.getToken(),
    });
  },
  autoConnect: true,
});

const SocketContext = React.createContext<typeof socket>(socket);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  React.useEffect(() => {
    socket.on('connect', () => {
      console.log('connected');
    });
    socket.on('disconnect', (error) => {
      console.log('disconnected');
    });
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => React.useContext(SocketContext);
