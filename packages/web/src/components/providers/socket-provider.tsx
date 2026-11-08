import React, { useEffect, useSyncExternalStore } from 'react';
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

const CONNECTION_LOST_TOAST_ID = 'websocket-disconnected';

const connectionState: ConnectionState = {
  holds: 0,
  reconnectPending: false,
  token: null,
  projectId: null,
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const token = useSyncExternalStore(
    authenticationSession.subscribe,
    readToken,
  );
  const projectId = useSyncExternalStore(
    authenticationSession.subscribe,
    readProjectId,
  );

  useEffect(() => {
    const onConnect = () => toast.dismiss(CONNECTION_LOST_TOAST_ID);
    const onDisconnect = (reason: string) => {
      if (reason !== 'io client disconnect') {
        toast('Connection Lost', {
          id: CONNECTION_LOST_TOAST_ID,
          description: 'We are trying to reconnect...',
          duration: Infinity,
        });
      }
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    };
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!token || !projectId) {
      connectionState.reconnectPending = false;
      connectionState.token = null;
      connectionState.projectId = null;
      socket.disconnect();
      return;
    }
    const changed =
      connectionState.token !== token ||
      connectionState.projectId !== projectId;
    connectionState.token = token;
    connectionState.projectId = projectId;
    socket.auth = { token, projectId };
    if (!socket.active) {
      socket.connect();
    } else if (changed) {
      reconnectWhenFree();
    }
  }, [token, projectId]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => React.useContext(SocketContext);

function holdConnection(): () => void {
  connectionState.holds++;
  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;
    connectionState.holds--;
    if (connectionState.holds === 0 && connectionState.reconnectPending) {
      connectionState.reconnectPending = false;
      reconnect();
    }
  };
}

function reconnectWhenFree(): void {
  if (connectionState.holds > 0) {
    connectionState.reconnectPending = true;
    return;
  }
  reconnect();
}

function reconnect(): void {
  socket.disconnect();
  socket.connect();
}

function readToken(): string | null {
  return authenticationSession.getToken();
}

function readProjectId(): string | null {
  return authenticationSession.getProjectId();
}

export const socketConnection = {
  hold: holdConnection,
};

type ConnectionState = {
  holds: number;
  reconnectPending: boolean;
  token: string | null;
  projectId: string | null;
};
