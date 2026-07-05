/**
 * @vitest-environment jsdom
 *
 * Regression test for https://github.com/activepieces/activepieces/issues/13554
 *
 * Clicking "Take Over" on the resource-lock banner used to call
 * window.location.reload() after the force-lock succeeded. A document reload
 * does not survive embed mode: the iframe re-mounts without the embed SDK
 * handshake and hangs on a blank screen. The hook must instead clear the
 * locked state, re-acquire the lock over the same socket, and notify the
 * caller via onTakeOver so the resource is refreshed in place.
 *
 * This file uses raw `react-dom` + React's `act` rather than
 * @testing-library/react (which is not a dependency of this package).
 */
/* eslint-disable testing-library/no-unnecessary-act */
import { WebsocketServerEvent } from '@activepieces/shared';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useResourceLock } from '@/hooks/use-resource-lock';

declare global {
  // Tells React the test wraps updates in act(); see React's act() docs.
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const socketState = vi.hoisted(() => {
  type LockResponse = {
    acquired: boolean;
    lock: { userId: string; userDisplayName: string } | null;
  };
  type EmitCall = {
    event: string;
    payload: { resourceId: string; force?: boolean };
    ack?: (response: LockResponse) => void;
  };
  const emitCalls: EmitCall[] = [];
  const fakeSocket = {
    on: (_event: string, _handler: (...args: unknown[]) => void) => fakeSocket,
    off: (_event: string, _handler: (...args: unknown[]) => void) => fakeSocket,
    emit: (
      event: string,
      payload: { resourceId: string; force?: boolean },
      ack?: (response: LockResponse) => void,
    ) => {
      emitCalls.push({ event, payload, ack });
      return fakeSocket;
    },
  };
  return { emitCalls, fakeSocket };
});

vi.mock('@/components/providers/socket-provider', () => ({
  useSocket: () => socketState.fakeSocket,
}));

vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: {
    getCurrentUserId: () => 'current-user',
  },
}));

const RESOURCE_ID = 'flow-1';
const OTHER_USER = { userId: 'other-user', userDisplayName: 'Other User' };

let latestHookResult: ReturnType<typeof useResourceLock> | null = null;

function Probe({ onTakeOver }: { onTakeOver: () => void }) {
  latestHookResult = useResourceLock({ resourceId: RESOURCE_ID, onTakeOver });
  return null;
}

function lockEmits() {
  return socketState.emitCalls.filter(
    (call) => call.event === WebsocketServerEvent.LOCK_RESOURCE,
  );
}

describe('useResourceLock takeOver', () => {
  let container: HTMLDivElement;
  let root: Root;
  const reloadSpy = vi.fn();
  // jsdom marks location.reload unforgeable, but vitest exposes `location`
  // as a configurable property of the test global, so the whole object can
  // be swapped for one with an observable reload
  const originalLocation = Object.getOwnPropertyDescriptor(window, 'location');

  beforeEach(() => {
    socketState.emitCalls.length = 0;
    latestHookResult = null;
    reloadSpy.mockClear();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload: reloadSpy },
    });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    if (originalLocation) {
      Object.defineProperty(window, 'location', originalLocation);
    }
  });

  it('re-acquires the lock and refreshes in place instead of reloading the document', async () => {
    const onTakeOver = vi.fn();
    await act(async () => {
      root.render(<Probe onTakeOver={onTakeOver} />);
    });

    const initialAcquire = lockEmits()[0];
    expect(initialAcquire).toBeDefined();
    expect(initialAcquire.payload).toEqual({ resourceId: RESOURCE_ID });

    await act(async () => {
      initialAcquire.ack?.({ acquired: false, lock: OTHER_USER });
    });
    expect(latestHookResult?.lockedBy).toEqual(OTHER_USER);

    await act(async () => {
      latestHookResult?.takeOver();
    });
    const forceAcquire = lockEmits().find((call) => call.payload.force);
    expect(forceAcquire).toBeDefined();
    expect(forceAcquire?.payload).toEqual({
      resourceId: RESOURCE_ID,
      force: true,
    });

    const emitCountBeforeAck = socketState.emitCalls.length;
    await act(async () => {
      forceAcquire?.ack?.({ acquired: true, lock: null });
    });

    expect(onTakeOver).toHaveBeenCalledTimes(1);
    expect(latestHookResult?.lockedBy).toBeNull();

    const reacquire = socketState.emitCalls
      .slice(emitCountBeforeAck)
      .find(
        (call) =>
          call.event === WebsocketServerEvent.LOCK_RESOURCE &&
          !call.payload.force,
      );
    expect(reacquire).toBeDefined();
    expect(reacquire?.payload).toEqual({ resourceId: RESOURCE_ID });

    await act(async () => {
      reacquire?.ack?.({ acquired: true, lock: null });
    });

    await act(async () => {
      root.unmount();
    });
    const unlock = socketState.emitCalls.find(
      (call) => call.event === WebsocketServerEvent.UNLOCK_RESOURCE,
    );
    expect(unlock).toBeDefined();
    expect(unlock?.payload).toEqual({ resourceId: RESOURCE_ID });
    expect(reloadSpy).not.toHaveBeenCalled();
  });

  it('keeps the locked state when the force acquire is rejected', async () => {
    const onTakeOver = vi.fn();
    await act(async () => {
      root.render(<Probe onTakeOver={onTakeOver} />);
    });

    const initialAcquire = lockEmits()[0];
    await act(async () => {
      initialAcquire.ack?.({ acquired: false, lock: OTHER_USER });
    });

    await act(async () => {
      latestHookResult?.takeOver();
    });
    const forceAcquire = lockEmits().find((call) => call.payload.force);
    await act(async () => {
      forceAcquire?.ack?.({ acquired: false, lock: OTHER_USER });
    });

    expect(onTakeOver).not.toHaveBeenCalled();
    expect(latestHookResult?.lockedBy).toEqual(OTHER_USER);
    expect(reloadSpy).not.toHaveBeenCalled();
  });
});
