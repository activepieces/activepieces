import { isNil } from '@activepieces/core-utils';
import {
  SwitchProjectResponse,
  WebsocketServerEvent,
} from '@activepieces/shared';
import { t } from 'i18next';
import React, { useEffect, useSyncExternalStore } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';

import { useSessionProjectId } from '@/hooks/use-session-project-id';
import { API_BASE_URL } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

const connection: ConnectionState = {
  token: null,
  wantedProjectId: null,
  serverProjectId: null,
  rejectedProjectId: null,
  pendingSwitch: null,
};

const socket = io(API_BASE_URL, {
  transports: ['websocket'],
  path: '/api/socket.io',
  autoConnect: false,
  reconnection: true,
  auth: (send) => send(startHandshake()),
});

const SocketContext = React.createContext<typeof socket>(socket);

const CONNECTION_LOST_TOAST_ID = 'websocket-disconnected';

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const token = useSyncExternalStore(
    authenticationSession.subscribe,
    readToken,
  );
  const projectId = useSessionProjectId();

  useEffect(() => {
    const onConnect = () => {
      toast.dismiss(CONNECTION_LOST_TOAST_ID);
      syncProject();
    };
    const onDisconnect = (reason: string) => {
      connection.pendingSwitch = null;
      if (reason !== 'io client disconnect') {
        toast(t('Connection lost'), {
          id: CONNECTION_LOST_TOAST_ID,
          description: t('Trying to reconnect…'),
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
      resetConnection();
      toast.dismiss(CONNECTION_LOST_TOAST_ID);
    };
  }, []);

  useEffect(() => {
    if (isNil(token)) {
      socket.disconnect();
      resetConnection();
      return;
    }
    if (connection.wantedProjectId !== projectId) {
      connection.rejectedProjectId = null;
    }
    connection.wantedProjectId = projectId;
    if (connection.token !== token) {
      connection.token = token;
      socket.disconnect();
      socket.connect();
      return;
    }
    if (!socket.active) {
      socket.connect();
      return;
    }
    syncProject();
  }, [token, projectId]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => React.useContext(SocketContext);

function startHandshake(): HandshakeAuth {
  connection.serverProjectId = connection.wantedProjectId;
  connection.pendingSwitch = null;
  return { token: connection.token, projectId: connection.wantedProjectId };
}

function syncProject(): void {
  const target = connection.wantedProjectId;
  if (
    !socket.connected ||
    !isNil(connection.pendingSwitch) ||
    isNil(target) ||
    target === connection.serverProjectId ||
    target === connection.rejectedProjectId
  ) {
    return;
  }
  const pending = { projectId: target };
  connection.pendingSwitch = pending;
  socket.emit(
    WebsocketServerEvent.SWITCH_PROJECT,
    { projectId: target },
    (response: unknown) => {
      if (connection.pendingSwitch !== pending) {
        return;
      }
      connection.pendingSwitch = null;
      const parsed = SwitchProjectResponse.safeParse(response);
      if (parsed.success && parsed.data.success) {
        connection.serverProjectId = target;
      } else {
        connection.rejectedProjectId = target;
        toast.error(t('Live updates are paused'), {
          description: t(
            'We could not connect live updates to this project. Reload the page to try again.',
          ),
        });
      }
      syncProject();
    },
  );
}

function resetConnection(): void {
  connection.token = null;
  connection.wantedProjectId = null;
  connection.serverProjectId = null;
  connection.rejectedProjectId = null;
  connection.pendingSwitch = null;
}

function readToken(): string | null {
  return authenticationSession.getToken();
}

type ConnectionState = {
  token: string | null;
  wantedProjectId: string | null;
  serverProjectId: string | null;
  rejectedProjectId: string | null;
  pendingSwitch: { projectId: string } | null;
};

type HandshakeAuth = {
  token: string | null;
  projectId: string | null;
};
