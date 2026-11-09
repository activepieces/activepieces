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
  heldEmits: [],
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

const LIVE_UPDATES_PAUSED_TOAST_ID = 'websocket-project-rejected';

const SWITCH_PROJECT_TIMEOUT_MS = 10_000;

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
    setWantedProject(projectId);
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

function emitInProject(send: () => void): void {
  setWantedProject(authenticationSession.getProjectId());
  connection.heldEmits = [...connection.heldEmits, send];
  syncProject();
}

function setWantedProject(projectId: string | null): void {
  if (connection.wantedProjectId === projectId) {
    return;
  }
  connection.rejectedProjectId = null;
  connection.wantedProjectId = projectId;
}

function startHandshake(): HandshakeAuth {
  connection.serverProjectId = null;
  connection.rejectedProjectId = null;
  connection.pendingSwitch = null;
  return { token: connection.token, projectId: connection.wantedProjectId };
}

function syncProject(): void {
  if (!socket.connected || !isNil(connection.pendingSwitch)) {
    return;
  }
  const target = connection.wantedProjectId;
  if (
    isNil(target) ||
    target === connection.serverProjectId ||
    target === connection.rejectedProjectId
  ) {
    releaseHeldEmits();
    return;
  }
  const pending = { projectId: target };
  connection.pendingSwitch = pending;
  socket
    .timeout(SWITCH_PROJECT_TIMEOUT_MS)
    .emit(
      WebsocketServerEvent.SWITCH_PROJECT,
      { projectId: target },
      (error: Error | null, response: unknown) => {
        if (connection.pendingSwitch !== pending) {
          return;
        }
        connection.pendingSwitch = null;
        const parsed = SwitchProjectResponse.safeParse(response);
        if (isNil(error) && parsed.success && parsed.data.success) {
          connection.serverProjectId = target;
        } else {
          connection.rejectedProjectId = target;
          toast.error(t('Live updates are paused'), {
            id: LIVE_UPDATES_PAUSED_TOAST_ID,
            description: t(
              'We could not connect live updates to this project. Reload the page to try again.',
            ),
          });
        }
        syncProject();
      },
    );
}

function releaseHeldEmits(): void {
  const held = connection.heldEmits;
  connection.heldEmits = [];
  held.forEach((send) => send());
}

function resetConnection(): void {
  connection.token = null;
  connection.wantedProjectId = null;
  connection.serverProjectId = null;
  connection.rejectedProjectId = null;
  connection.pendingSwitch = null;
  connection.heldEmits = [];
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
  heldEmits: (() => void)[];
};

type HandshakeAuth = {
  token: string | null;
  projectId: string | null;
};

export { emitInProject };
