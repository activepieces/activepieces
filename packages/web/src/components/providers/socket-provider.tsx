import { t } from 'i18next';
import React, { useEffect, useSyncExternalStore } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';

import { useSessionProjectId } from '@/hooks/use-session-project-id';
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
  epoch: 0,
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
  const projectId = useSessionProjectId();

  useEffect(() => {
    const onConnect = () => toast.dismiss(CONNECTION_LOST_TOAST_ID);
    const onDisconnect = (reason: string) => {
      if (reason !== 'io client disconnect') {
        toast(t('Connection Lost'), {
          id: CONNECTION_LOST_TOAST_ID,
          description: t('We are trying to reconnect...'),
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
      resetConnectionState();
      socket.disconnect();
      toast.dismiss(CONNECTION_LOST_TOAST_ID);
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
  const epoch = connectionState.epoch;
  let released = false;
  return () => {
    if (released || epoch !== connectionState.epoch) {
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

function resetConnectionState(): void {
  connectionState.epoch++;
  connectionState.holds = 0;
  connectionState.reconnectPending = false;
  connectionState.token = null;
  connectionState.projectId = null;
}

function reconnect(): void {
  socket.disconnect();
  socket.connect();
}

function readToken(): string | null {
  return authenticationSession.getToken();
}

export const socketConnection = {
  hold: holdConnection,
};

type ConnectionState = {
  epoch: number;
  holds: number;
  reconnectPending: boolean;
  token: string | null;
  projectId: string | null;
};
