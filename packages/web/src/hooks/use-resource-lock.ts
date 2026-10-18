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
  const currentAcquire = useRef<symbol | null>(null);
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
      if (event.resourceId !== resourceId) {
        return;
      }
      if (event.userId !== currentUserId) {
        setLockedBy({
          userId: event.userId,
          userDisplayName: event.userDisplayName,
        });
      } else if (!acquiresFreedLock) {
        setLockedBy(null);
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
    const stopWaitingAfterLockFreed = () => {
      onLockFreed()
        .then(() =>
          setLockedBy((holder) => (holder === lockedBy ? null : holder)),
        )
        .catch(() => undefined);
    };
    const acquireFreedLock = (event: ResourceUnlockedEvent) => {
      if (event.resourceId !== resourceId) {
        return;
      }
      const acquire = currentAcquire.current;
      socket.emit(
        WebsocketServerEvent.LOCK_RESOURCE,
        { resourceId },
        (response: LockResourceResponse) => {
          if (isNil(acquire) || currentAcquire.current !== acquire) {
            releaseLateAcquire({
              acquired: response.acquired,
              acquire,
              resourceId,
              socket,
              beforeRelease: beforeReleaseRef.current,
            });
            return;
          }
          if (!isNil(response.lock)) {
            setLockedBy(response.lock);
            return;
          }
          isOwner.current = response.acquired;
          stopWaitingAfterLockFreed();
        },
      );
    };
    const shareLockOfSameUser = (event: ResourceLockedEvent) => {
      if (event.resourceId !== resourceId || event.userId !== currentUserId) {
        return;
      }
      isOwner.current = true;
      stopWaitingAfterLockFreed();
    };
    socket.on(WebsocketClientEvent.RESOURCE_UNLOCKED, acquireFreedLock);
    socket.on(WebsocketClientEvent.RESOURCE_LOCKED, shareLockOfSameUser);
    return () => {
      socket.off(WebsocketClientEvent.RESOURCE_UNLOCKED, acquireFreedLock);
      socket.off(WebsocketClientEvent.RESOURCE_LOCKED, shareLockOfSameUser);
    };
  }, [resourceId, socket, lockedBy, onLockFreed, currentUserId]);

  useEffect(() => {
    const acquire = Symbol(resourceId);
    latestAcquireByResource.set(resourceId, acquire);
    currentAcquire.current = acquire;
    socket.emit(
      WebsocketServerEvent.LOCK_RESOURCE,
      { resourceId },
      (response: LockResourceResponse) => {
        if (currentAcquire.current !== acquire) {
          releaseLateAcquire({
            acquired: response.acquired,
            acquire,
            resourceId,
            socket,
            beforeRelease: beforeReleaseRef.current,
          });
          return;
        }
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
      currentAcquire.current = null;
      clearInterval(heartbeat);
      if (isOwner.current) {
        isOwner.current = false;
        releaseAfter({
          beforeRelease: beforeReleaseRef.current,
          release: () =>
            releaseIfLatestAcquire({ acquire, resourceId, socket }),
        });
      }
    };
  }, [resourceId, socket, lockSession]);

  const takeOver = useCallback(() => {
    const acquire = currentAcquire.current;
    socket.emit(
      WebsocketServerEvent.LOCK_RESOURCE,
      { resourceId, force: true },
      (response: LockResourceResponse) => {
        if (isNil(acquire) || currentAcquire.current !== acquire) {
          releaseLateAcquire({
            acquired: response.acquired,
            acquire,
            resourceId,
            socket,
            beforeRelease: beforeReleaseRef.current,
          });
          return;
        }
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

function releaseLateAcquire({
  acquired,
  acquire,
  resourceId,
  socket,
  beforeRelease,
}: {
  acquired: boolean;
  acquire: symbol | null;
  resourceId: string;
  socket: Socket;
  beforeRelease: (() => Promise<void>) | undefined;
}) {
  if (!acquired || isNil(acquire)) {
    return;
  }
  releaseAfter({
    beforeRelease,
    release: () => releaseIfLatestAcquire({ acquire, resourceId, socket }),
  });
}

function releaseIfLatestAcquire({
  acquire,
  resourceId,
  socket,
}: {
  acquire: symbol;
  resourceId: string;
  socket: Socket;
}) {
  if (latestAcquireByResource.get(resourceId) !== acquire) {
    return;
  }
  latestAcquireByResource.delete(resourceId);
  socket.emit(WebsocketServerEvent.UNLOCK_RESOURCE, { resourceId });
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

type Socket = ReturnType<typeof useSocket>;
