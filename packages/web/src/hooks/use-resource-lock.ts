import { isNil } from '@activepieces/core-utils';
import {
  ResourceLockedEvent,
  ResourceUnlockedEvent,
  LockResourceResponse,
  WebsocketClientEvent,
  WebsocketServerEvent,
} from '@activepieces/shared';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useSocket } from '@/components/providers/socket-provider';
import { authenticationSession } from '@/lib/authentication-session';

const latestAcquireByResource = new Map<string, symbol>();

function useResourceLock({
  resourceId,
  onTakeOver,
  onLockFreed,
  beforeRelease,
}: UseResourceLockParams) {
  const socket = useSocket();
  const currentUserId = authenticationSession.getCurrentUserId();
  const isOwner = useRef(false);
  // bumped after a successful take-over so the acquire effect re-runs and
  // registers ownership on this socket, replacing the previous full-page
  // reload (which broke the embed SDK handshake inside an iframe)
  const [lockSession, setLockSession] = useState(0);
  const [lockedBy, setLockedBy] = useState<LockHolder | null>(null);
  const acquiresFreedLock = !isNil(onLockFreed);
  const beforeReleaseRef = useRef(beforeRelease);
  beforeReleaseRef.current = beforeRelease;

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
      if (event.resourceId === resourceId && !acquiresFreedLock) {
        setLockedBy(null);
      }
    };

    socket.on(WebsocketClientEvent.RESOURCE_LOCKED, handleLocked);
    socket.on(WebsocketClientEvent.RESOURCE_UNLOCKED, handleUnlocked);

    return () => {
      socket.off(WebsocketClientEvent.RESOURCE_LOCKED, handleLocked);
      socket.off(WebsocketClientEvent.RESOURCE_UNLOCKED, handleUnlocked);
    };
  }, [resourceId, socket, currentUserId, acquiresFreedLock]);

  useEffect(() => {
    if (isNil(onLockFreed) || isNil(lockedBy)) {
      return;
    }
    const acquireFreedLock = (event: ResourceUnlockedEvent) => {
      if (event.resourceId !== resourceId) {
        return;
      }
      socket.emit(
        WebsocketServerEvent.LOCK_RESOURCE,
        { resourceId },
        (response: LockResourceResponse) => {
          if (!isNil(response.lock)) {
            setLockedBy(response.lock);
            return;
          }
          isOwner.current = response.acquired;
          onLockFreed()
            .then(() =>
              setLockedBy((holder) => (holder === lockedBy ? null : holder)),
            )
            .catch(() => undefined);
        },
      );
    };
    socket.on(WebsocketClientEvent.RESOURCE_UNLOCKED, acquireFreedLock);
    return () => {
      socket.off(WebsocketClientEvent.RESOURCE_UNLOCKED, acquireFreedLock);
    };
  }, [resourceId, socket, lockedBy, onLockFreed]);

  useEffect(() => {
    const acquire = Symbol(resourceId);
    latestAcquireByResource.set(resourceId, acquire);
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
        isOwner.current = false;
        releaseAfter({
          beforeRelease: beforeReleaseRef.current,
          release: () => {
            if (latestAcquireByResource.get(resourceId) !== acquire) {
              return;
            }
            latestAcquireByResource.delete(resourceId);
            socket.emit(WebsocketServerEvent.UNLOCK_RESOURCE, { resourceId });
          },
        });
      }
    };
  }, [resourceId, socket, lockSession]);

  const takeOver = useCallback(() => {
    socket.emit(
      WebsocketServerEvent.LOCK_RESOURCE,
      { resourceId, force: true },
      (response: LockResourceResponse) => {
        if (response.acquired) {
          isOwner.current = false;
          setLockedBy(null);
          setLockSession((session) => session + 1);
          void onTakeOver?.();
        }
      },
    );
  }, [resourceId, socket, onTakeOver]);

  return { lockedBy, takeOver };
}

function releaseAfter({
  beforeRelease,
  release,
}: {
  beforeRelease: (() => Promise<void>) | undefined;
  release: () => void;
}) {
  if (isNil(beforeRelease)) {
    release();
    return;
  }
  beforeRelease()
    .finally(release)
    .catch(() => undefined);
}

export { useResourceLock };

type UseResourceLockParams = {
  resourceId: string;
  onTakeOver?: () => void | Promise<void>;
  onLockFreed?: () => Promise<void>;
  beforeRelease?: () => Promise<void>;
};

type LockHolder = NonNullable<LockResourceResponse['lock']>;
