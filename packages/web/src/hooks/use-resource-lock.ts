import {
  ResourceLockedEvent,
  ResourceUnlockedEvent,
  LockResourceResponse,
  WebsocketClientEvent,
  WebsocketServerEvent,
} from '@activepieces/shared';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useEmbedding } from '@/components/providers/embed-provider';
import { useSocket } from '@/components/providers/socket-provider';
import { authenticationSession } from '@/lib/authentication-session';

async function completeTakeOver({
  isEmbedded,
  onTakeOver,
  reload,
}: {
  isEmbedded: boolean;
  onTakeOver?: () => Promise<void> | void;
  reload: () => void;
}) {
  if (isEmbedded && onTakeOver) {
    await onTakeOver();
    return;
  }

  reload();
}

function useResourceLock({ resourceId, onTakeOver }: UseResourceLockParams) {
  const socket = useSocket();
  const currentUserId = authenticationSession.getCurrentUserId();
  const {
    embedState: { isEmbedded },
  } = useEmbedding();
  const isOwner = useRef(false);
  const [lockedBy, setLockedBy] = useState<{
    userId: string;
    userDisplayName: string;
  } | null>(null);

  useEffect(() => {
    const handleLocked = (event: ResourceLockedEvent) => {
      if (event.resourceId === resourceId && event.userId !== currentUserId) {
        setLockedBy({
          userId: event.userId,
          userDisplayName: event.userDisplayName,
        });
      }
    };
    const handleUnlocked = (event: ResourceUnlockedEvent) => {
      if (event.resourceId === resourceId) {
        setLockedBy(null);
      }
    };

    socket.on(WebsocketClientEvent.RESOURCE_LOCKED, handleLocked);
    socket.on(WebsocketClientEvent.RESOURCE_UNLOCKED, handleUnlocked);

    return () => {
      socket.off(WebsocketClientEvent.RESOURCE_LOCKED, handleLocked);
      socket.off(WebsocketClientEvent.RESOURCE_UNLOCKED, handleUnlocked);
    };
  }, [resourceId, socket, currentUserId]);

  useEffect(() => {
    socket.emit(
      WebsocketServerEvent.LOCK_RESOURCE,
      { resourceId },
      (response: LockResourceResponse) => {
        if (response.acquired) {
          isOwner.current = true;
        } else if (response.lock) {
          setLockedBy(response.lock);
        }
      },
    );

    const heartbeat = setInterval(() => {
      if (!isOwner.current) {
        return;
      }
      socket.emit(
        WebsocketServerEvent.LOCK_RESOURCE,
        { resourceId },
        (response: LockResourceResponse) => {
          if (!response.acquired && response.lock) {
            isOwner.current = false;
            setLockedBy(response.lock);
          }
        },
      );
    }, 30_000);

    return () => {
      clearInterval(heartbeat);
      if (isOwner.current) {
        socket.emit(WebsocketServerEvent.UNLOCK_RESOURCE, { resourceId });
        isOwner.current = false;
      }
    };
  }, [resourceId, socket]);

  const takeOver = useCallback(() => {
    socket.emit(
      WebsocketServerEvent.LOCK_RESOURCE,
      { resourceId, force: true },
      async (response: LockResourceResponse) => {
        if (response.acquired) {
          isOwner.current = true;
          setLockedBy(null);
          await completeTakeOver({
            isEmbedded,
            onTakeOver,
            reload: () => window.location.reload(),
          });
        }
      },
    );
  }, [resourceId, socket, isEmbedded, onTakeOver]);

  return { lockedBy, takeOver };
}

export { completeTakeOver, useResourceLock };

type UseResourceLockParams = {
  resourceId: string;
  onTakeOver?: () => Promise<void> | void;
};
