import {
  ResourceLockedEvent,
  ResourceUnlockedEvent,
  LockResourceResponse,
  LockerKind,
  WebsocketClientEvent,
  WebsocketServerEvent,
} from '@activepieces/shared';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useSocket } from '@/components/providers/socket-provider';
import { authenticationSession } from '@/lib/authentication-session';

function useResourceLock({ resourceId, onUnlocked }: UseResourceLockParams) {
  const socket = useSocket();
  const currentUserId = authenticationSession.getCurrentUserId();
  const isOwner = useRef(false);
  const [lockedBy, setLockedBy] = useState<LockedByState>(null);
  const lockedByRef = useRef<LockedByState>(null);
  lockedByRef.current = lockedBy;
  const onUnlockedRef = useRef(onUnlocked);
  onUnlockedRef.current = onUnlocked;

  useEffect(() => {
    const handleLocked = (event: ResourceLockedEvent) => {
      if (event.resourceId === resourceId && event.userId !== currentUserId) {
        setLockedBy({
          userId: event.userId,
          userDisplayName: event.userDisplayName,
          lockerKind: event.lockerKind ?? LockerKind.USER,
          reason: event.reason,
        });
      }
    };
    const handleUnlocked = (event: ResourceUnlockedEvent) => {
      if (event.resourceId === resourceId) {
        const prev = lockedByRef.current;
        setLockedBy(null);
        onUnlockedRef.current?.({ lockerKind: prev?.lockerKind });
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
          setLockedBy({
            userId: response.lock.userId,
            userDisplayName: response.lock.userDisplayName,
            lockerKind: response.lock.lockerKind ?? LockerKind.USER,
            reason: response.lock.reason,
          });
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
            setLockedBy({
              userId: response.lock.userId,
              userDisplayName: response.lock.userDisplayName,
              lockerKind: response.lock.lockerKind ?? LockerKind.USER,
              reason: response.lock.reason,
            });
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
      (response: LockResourceResponse) => {
        if (response.acquired) {
          isOwner.current = false;
          window.location.reload();
        }
      },
    );
  }, [resourceId, socket]);

  return { lockedBy, takeOver };
}

export { useResourceLock };

type LockedByState = {
  userId: string;
  userDisplayName: string;
  lockerKind: LockerKind;
  reason?: string;
} | null;

type UseResourceLockParams = {
  resourceId: string;
  onUnlocked?: (info: { lockerKind?: LockerKind }) => void;
};
