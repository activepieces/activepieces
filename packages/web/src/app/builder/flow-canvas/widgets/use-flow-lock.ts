import {
  FlowLockedEvent,
  FlowUnlockedEvent,
  WebsocketLockFlowResponse,
  WebsocketClientEvent,
  WebsocketServerEvent,
} from '@activepieces/shared';
import { useCallback, useEffect, useState } from 'react';

import { useSocket } from '@/components/providers/socket-provider';
import { authenticationSession } from '@/lib/authentication-session';

import { useBuilderStateContext } from '../../builder-hooks';

function useFlowLock() {
  const [readonly, flowId, setReadOnly] = useBuilderStateContext((state) => [
    state.readonly,
    state.flow.id,
    state.setReadOnly,
  ]);
  const socket = useSocket();
  const currentUserId = authenticationSession.getCurrentUserId();
  const [lockedBy, setLockedBy] = useState<{
    userId: string;
    userDisplayName: string;
  } | null>(null);

  useEffect(() => {
    if (readonly) return;

    socket.emit(
      WebsocketServerEvent.LOCK_FLOW,
      { flowId },
      (response: WebsocketLockFlowResponse) => {
        if (!response.acquired && response.lock) {
          setLockedBy(response.lock);
          setReadOnly(true);
        }
      },
    );

    const heartbeat = setInterval(() => {
      socket.emit(
        WebsocketServerEvent.LOCK_FLOW,
        { flowId },
        (response: WebsocketLockFlowResponse) => {
          if (!response.acquired && response.lock) {
            setLockedBy(response.lock);
            setReadOnly(true);
          }
        },
      );
    }, 30_000);

    const handleLocked = (event: FlowLockedEvent) => {
      if (event.flowId === flowId && event.userId !== currentUserId) {
        setLockedBy({
          userId: event.userId,
          userDisplayName: event.userDisplayName,
        });
        setReadOnly(true);
      }
    };
    const handleUnlocked = (event: FlowUnlockedEvent) => {
      if (event.flowId === flowId) {
        setLockedBy(null);
        socket.emit(
          WebsocketServerEvent.LOCK_FLOW,
          { flowId },
          (response: WebsocketLockFlowResponse) => {
            if (!response.acquired && response.lock) {
              setLockedBy(response.lock);
              setReadOnly(true);
            } else {
              setReadOnly(false);
            }
          },
        );
      }
    };

    socket.on(WebsocketClientEvent.FLOW_LOCKED, handleLocked);
    socket.on(WebsocketClientEvent.FLOW_UNLOCKED, handleUnlocked);

    return () => {
      clearInterval(heartbeat);
      socket.off(WebsocketClientEvent.FLOW_LOCKED, handleLocked);
      socket.off(WebsocketClientEvent.FLOW_UNLOCKED, handleUnlocked);
      socket.emit(WebsocketServerEvent.UNLOCK_FLOW, { flowId });
    };
  }, [flowId, readonly, socket, currentUserId]);

  const takeOver = useCallback(() => {
    socket.emit(
      WebsocketServerEvent.LOCK_FLOW,
      { flowId, force: true },
      (response: WebsocketLockFlowResponse) => {
        if (response.acquired) {
          setLockedBy(null);
          setReadOnly(false);
        }
      },
    );
  }, [flowId, socket, setReadOnly]);

  return { lockedBy, takeOver };
}

export { useFlowLock };
