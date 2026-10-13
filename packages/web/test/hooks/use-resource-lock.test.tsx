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
import {
  WebsocketClientEvent,
  WebsocketServerEvent,
} from '@activepieces/shared';
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
  type ClientHandler = (payload: unknown) => void;
  const emitCalls: EmitCall[] = [];
  const handlers: Record<string, ClientHandler[]> = {};
  const fakeSocket = {
    on: (event: string, handler: ClientHandler) => {
      (handlers[event] ??= []).push(handler);
      return fakeSocket;
    },
    off: (event: string, handler: ClientHandler) => {
      handlers[event] = (handlers[event] ?? []).filter((h) => h !== handler);
      return fakeSocket;
    },
    emit: (
      event: string,
      payload: { resourceId: string; force?: boolean },
      ack?: (response: LockResponse) => void,
    ) => {
      emitCalls.push({ event, payload, ack });
      return fakeSocket;
    },
  };
  const dispatch = (event: string, payload: unknown) => {
    (handlers[event] ?? []).forEach((handler) => handler(payload));
  };
  const reset = () => {
    emitCalls.length = 0;
    for (const key of Object.keys(handlers)) {
      delete handlers[key];
    }
  };
  return { emitCalls, fakeSocket, dispatch, reset };
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
const THIRD_USER = { userId: 'third-user', userDisplayName: 'Third User' };

let latestHookResult: ReturnType<typeof useResourceLock> | null = null;

function Probe({
  onTakeOver,
  onLockFreed,
  beforeRelease,
}: {
  onTakeOver: () => void;
  onLockFreed?: () => Promise<void>;
  beforeRelease?: () => Promise<void>;
}) {
  latestHookResult = useResourceLock({
    resourceId: RESOURCE_ID,
    onTakeOver,
    onLockFreed,
    beforeRelease,
  });
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
    socketState.reset();
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

    const windowAfterForceAck = socketState.emitCalls.slice(emitCountBeforeAck);
    const reacquireIndex = windowAfterForceAck.findIndex(
      (call) =>
        call.event === WebsocketServerEvent.LOCK_RESOURCE &&
        !call.payload.force,
    );
    expect(reacquireIndex).toBeGreaterThanOrEqual(0);
    // takeOver clears isOwner before bumping the session, so the acquire
    // effect's cleanup must NOT emit a stray UNLOCK before the re-acquire —
    // that would briefly release the lock we just force-acquired
    expect(
      windowAfterForceAck
        .slice(0, reacquireIndex)
        .some((call) => call.event === WebsocketServerEvent.UNLOCK_RESOURCE),
    ).toBe(false);

    const reacquire = windowAfterForceAck[reacquireIndex];
    expect(reacquire.payload).toEqual({ resourceId: RESOURCE_ID });

    await act(async () => {
      reacquire.ack?.({ acquired: true, lock: null });
    });

    await act(async () => {
      root.unmount();
    });
    const unlocks = socketState.emitCalls.filter(
      (call) => call.event === WebsocketServerEvent.UNLOCK_RESOURCE,
    );
    expect(unlocks).toHaveLength(1);
    expect(unlocks[0].payload).toEqual({ resourceId: RESOURCE_ID });
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

  it('tracks the locker from broadcasts and ignores its own and unrelated locks', async () => {
    await act(async () => {
      root.render(<Probe onTakeOver={vi.fn()} />);
    });

    await act(async () => {
      socketState.dispatch(WebsocketClientEvent.RESOURCE_LOCKED, {
        resourceId: RESOURCE_ID,
        userId: 'current-user',
        userDisplayName: 'Me',
      });
    });
    expect(latestHookResult?.lockedBy).toBeNull();

    await act(async () => {
      socketState.dispatch(WebsocketClientEvent.RESOURCE_LOCKED, {
        resourceId: 'another-resource',
        ...OTHER_USER,
      });
    });
    expect(latestHookResult?.lockedBy).toBeNull();

    await act(async () => {
      socketState.dispatch(WebsocketClientEvent.RESOURCE_LOCKED, {
        resourceId: RESOURCE_ID,
        ...OTHER_USER,
      });
    });
    expect(latestHookResult?.lockedBy).toEqual(OTHER_USER);

    await act(async () => {
      socketState.dispatch(WebsocketClientEvent.RESOURCE_UNLOCKED, {
        resourceId: RESOURCE_ID,
      });
    });
    expect(latestHookResult?.lockedBy).toBeNull();
    expect(lockEmits()).toHaveLength(1);
  });

  it('does not release the lock during re-acquire when a stale owner takes over', async () => {
    const onTakeOver = vi.fn();
    await act(async () => {
      root.render(<Probe onTakeOver={onTakeOver} />);
    });

    // we acquire the lock first, so isOwner becomes true on this client
    const initialAcquire = lockEmits()[0];
    await act(async () => {
      initialAcquire.ack?.({ acquired: true, lock: null });
    });

    // another client force-takes-over: the server broadcasts RESOURCE_LOCKED,
    // so the take-over banner shows while this client is still a stale owner
    await act(async () => {
      socketState.dispatch(WebsocketClientEvent.RESOURCE_LOCKED, {
        resourceId: RESOURCE_ID,
        ...OTHER_USER,
      });
    });
    expect(latestHookResult?.lockedBy).toEqual(OTHER_USER);

    await act(async () => {
      latestHookResult?.takeOver();
    });
    const forceAcquire = lockEmits().find((call) => call.payload.force);
    expect(forceAcquire).toBeDefined();

    const emitCountBeforeAck = socketState.emitCalls.length;
    await act(async () => {
      forceAcquire?.ack?.({ acquired: true, lock: null });
    });

    // the session bump re-runs the acquire effect; because takeOver reset
    // isOwner to false, the cleanup must not emit a stray UNLOCK before the
    // non-force re-acquire, even though this client was previously the owner
    const windowAfterForceAck = socketState.emitCalls.slice(emitCountBeforeAck);
    const reacquireIndex = windowAfterForceAck.findIndex(
      (call) =>
        call.event === WebsocketServerEvent.LOCK_RESOURCE &&
        !call.payload.force,
    );
    expect(reacquireIndex).toBeGreaterThanOrEqual(0);
    expect(
      windowAfterForceAck
        .slice(0, reacquireIndex)
        .some((call) => call.event === WebsocketServerEvent.UNLOCK_RESOURCE),
    ).toBe(false);
    expect(onTakeOver).toHaveBeenCalledTimes(1);
    expect(latestHookResult?.lockedBy).toBeNull();
    expect(reloadSpy).not.toHaveBeenCalled();
  });
});

describe('useResourceLock with onLockFreed', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    socketState.reset();
    latestHookResult = null;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('takes a freed lock, and stops waiting only after the callback ends', async () => {
    const callbackRun = Promise.withResolvers<void>();
    const onLockFreed = vi.fn(() => callbackRun.promise);
    await mountWaitingFor({ onLockFreed, holder: OTHER_USER });

    await freeTheLock();
    const freedLockAcquire = lockEmits()[1];
    expect(freedLockAcquire.payload).toEqual({ resourceId: RESOURCE_ID });
    expect(latestHookResult?.lockedBy).toEqual(OTHER_USER);

    await act(async () => {
      freedLockAcquire.ack?.({ acquired: true, lock: null });
    });
    expect(onLockFreed).toHaveBeenCalledTimes(1);
    expect(latestHookResult?.lockedBy).toEqual(OTHER_USER);

    await act(async () => {
      callbackRun.resolve();
    });
    expect(latestHookResult?.lockedBy).toBeNull();

    await act(async () => {
      root.unmount();
    });
    expect(unlockEmits()).toEqual([
      expect.objectContaining({ payload: { resourceId: RESOURCE_ID } }),
    ]);
  });

  it('shows the user who took the freed lock first, and does not call the callback', async () => {
    const onLockFreed = vi.fn(() => Promise.resolve());
    await mountWaitingFor({ onLockFreed, holder: OTHER_USER });

    await freeTheLock();
    await act(async () => {
      lockEmits()[1].ack?.({ acquired: false, lock: THIRD_USER });
    });

    expect(latestHookResult?.lockedBy).toEqual(THIRD_USER);
    expect(onLockFreed).not.toHaveBeenCalled();
  });

  it('runs the callback and stops waiting, without the lock, when the server denies the lock and names no holder', async () => {
    const onLockFreed = vi.fn(() => Promise.resolve());
    await mountWaitingFor({ onLockFreed, holder: OTHER_USER });

    await freeTheLock();
    await act(async () => {
      lockEmits()[1].ack?.({ acquired: false, lock: null });
    });

    expect(onLockFreed).toHaveBeenCalledTimes(1);
    expect(latestHookResult?.lockedBy).toBeNull();
    await act(async () => {
      root.unmount();
    });
    expect(unlockEmits()).toHaveLength(0);
  });

  it('keeps a user who takes over while the callback runs', async () => {
    const callbackRun = Promise.withResolvers<void>();
    await mountWaitingFor({
      onLockFreed: () => callbackRun.promise,
      holder: OTHER_USER,
    });

    await freeTheLock();
    await act(async () => {
      lockEmits()[1].ack?.({ acquired: true, lock: null });
    });
    await act(async () => {
      socketState.dispatch(WebsocketClientEvent.RESOURCE_LOCKED, {
        resourceId: RESOURCE_ID,
        ...THIRD_USER,
      });
    });
    await act(async () => {
      callbackRun.resolve();
    });

    expect(latestHookResult?.lockedBy).toEqual(THIRD_USER);
  });

  it('keeps waiting for the lock when the callback fails', async () => {
    await mountWaitingFor({
      onLockFreed: () => Promise.reject(new Error('Network Error')),
      holder: OTHER_USER,
    });

    await freeTheLock();
    await act(async () => {
      lockEmits()[1].ack?.({ acquired: true, lock: null });
    });

    expect(latestHookResult?.lockedBy).toEqual(OTHER_USER);
  });

  it('does not take a freed lock when the tab does not wait for it', async () => {
    const onLockFreed = vi.fn(() => Promise.resolve());
    await act(async () => {
      root.render(<Probe onTakeOver={vi.fn()} onLockFreed={onLockFreed} />);
    });
    await act(async () => {
      lockEmits()[0].ack?.({ acquired: true, lock: null });
    });

    await freeTheLock();

    expect(lockEmits()).toHaveLength(1);
    expect(onLockFreed).not.toHaveBeenCalled();
  });

  async function mountWaitingFor({
    onLockFreed,
    holder,
  }: {
    onLockFreed: () => Promise<void>;
    holder: { userId: string; userDisplayName: string };
  }) {
    await act(async () => {
      root.render(<Probe onTakeOver={vi.fn()} onLockFreed={onLockFreed} />);
    });
    await act(async () => {
      lockEmits()[0].ack?.({ acquired: false, lock: holder });
    });
  }
});

describe('useResourceLock with beforeRelease', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    socketState.reset();
    latestHookResult = null;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('releases the lock on unmount only after beforeRelease ends', async () => {
    const pendingSave = Promise.withResolvers<void>();
    const beforeRelease = vi.fn(() => pendingSave.promise);
    await mountOwning({ beforeRelease });

    await act(async () => {
      root.unmount();
    });
    expect(beforeRelease).toHaveBeenCalledTimes(1);
    expect(unlockEmits()).toHaveLength(0);

    await act(async () => {
      pendingSave.resolve();
    });
    expect(unlockEmits()).toEqual([
      expect.objectContaining({ payload: { resourceId: RESOURCE_ID } }),
    ]);
  });

  it('still releases the lock when beforeRelease fails', async () => {
    await mountOwning({
      beforeRelease: () => Promise.reject(new Error('Network Error')),
    });

    await act(async () => {
      root.unmount();
    });

    expect(unlockEmits()).toHaveLength(1);
  });

  it('keeps the lock when the same resource mounts again before beforeRelease ends', async () => {
    const pendingSave = Promise.withResolvers<void>();
    await mountOwning({ beforeRelease: () => pendingSave.promise });
    await act(async () => {
      root.unmount();
    });

    root = createRoot(container);
    await mountOwning({ beforeRelease: () => Promise.resolve() });
    await act(async () => {
      pendingSave.resolve();
    });
    expect(unlockEmits()).toHaveLength(0);

    await act(async () => {
      root.unmount();
    });
    expect(unlockEmits()).toHaveLength(1);
  });

  it('does not run beforeRelease when the tab does not own the lock', async () => {
    const beforeRelease = vi.fn(() => Promise.resolve());
    await act(async () => {
      root.render(<Probe onTakeOver={vi.fn()} beforeRelease={beforeRelease} />);
    });
    await act(async () => {
      lockEmits()[0].ack?.({ acquired: false, lock: OTHER_USER });
    });

    await act(async () => {
      root.unmount();
    });

    expect(beforeRelease).not.toHaveBeenCalled();
    expect(unlockEmits()).toHaveLength(0);
  });

  async function mountOwning({
    beforeRelease,
  }: {
    beforeRelease: () => Promise<void>;
  }) {
    await act(async () => {
      root.render(<Probe onTakeOver={vi.fn()} beforeRelease={beforeRelease} />);
    });
    await act(async () => {
      lockEmits().at(-1)?.ack?.({ acquired: true, lock: null });
    });
  }
});

async function freeTheLock() {
  await act(async () => {
    socketState.dispatch(WebsocketClientEvent.RESOURCE_UNLOCKED, {
      resourceId: RESOURCE_ID,
    });
  });
}

function unlockEmits() {
  return socketState.emitCalls.filter(
    (call) => call.event === WebsocketServerEvent.UNLOCK_RESOURCE,
  );
}
