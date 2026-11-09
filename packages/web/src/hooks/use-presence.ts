import {
  PresenceUpdatedEvent,
  PresenceUser,
  WebsocketClientEvent,
  WebsocketServerEvent,
} from '@activepieces/shared';
import { useEffect, useState } from 'react';

import {
  dropHeldEmits,
  emitInProject,
  useSocket,
} from '@/components/providers/socket-provider';
import { authenticationSession } from '@/lib/authentication-session';

function usePresence({ resourceId }: { resourceId: string }): PresenceUser[] {
  const socket = useSocket();
  const currentUserId = authenticationSession.getCurrentUserId();
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    const handlePresenceUpdated = (event: PresenceUpdatedEvent) => {
      if (event.resourceId === resourceId) {
        setActiveUsers(event.users.filter((u) => u.userId !== currentUserId));
      }
    };

    socket.on(WebsocketClientEvent.PRESENCE_UPDATED, handlePresenceUpdated);

    return () => {
      socket.off(WebsocketClientEvent.PRESENCE_UPDATED, handlePresenceUpdated);
    };
  }, [resourceId, socket, currentUserId]);

  useEffect(() => {
    let active = true;
    const joinKey = Symbol('presence-join');
    const heartbeatKey = Symbol('presence-heartbeat');
    emitInProject({
      key: joinKey,
      send: () =>
        socket.emit(
          WebsocketServerEvent.JOIN_PRESENCE,
          { resourceId },
          (response: { users: PresenceUser[] }) => {
            if (!active) {
              return;
            }
            setActiveUsers(
              response.users.filter((u) => u.userId !== currentUserId),
            );
          },
        ),
    });

    const heartbeat = setInterval(() => {
      emitInProject({
        key: heartbeatKey,
        send: () =>
          socket.emit(WebsocketServerEvent.JOIN_PRESENCE, { resourceId }),
      });
    }, 30_000);

    return () => {
      active = false;
      clearInterval(heartbeat);
      dropHeldEmits([joinKey, heartbeatKey]);
      socket.emit(WebsocketServerEvent.LEAVE_PRESENCE, { resourceId });
    };
  }, [resourceId, socket, currentUserId]);

  return activeUsers;
}

export { usePresence };
