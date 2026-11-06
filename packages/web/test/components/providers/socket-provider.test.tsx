// @vitest-environment jsdom
import { act, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const socketHarness = vi.hoisted(() => {
  type Handler = (payload?: unknown) => void;
  const handlers: Record<string, Handler[]> = {};
  const socket = {
    connected: false,
    auth: {},
    connect: () => {
      socket.connected = true;
      return socket;
    },
    disconnect: () => {
      socket.connected = false;
      return socket;
    },
    on: (event: string, handler: Handler) => {
      (handlers[event] ??= []).push(handler);
      return socket;
    },
    off: (event: string, handler?: Handler) => {
      handlers[event] = handler
        ? (handlers[event] ?? []).filter((registered) => registered !== handler)
        : [];
      return socket;
    },
  };
  const sendFromServer = (event: string) => {
    (handlers[event] ?? []).forEach((handler) => handler());
  };
  const listenerCount = (event: string) => (handlers[event] ?? []).length;
  return { socket, sendFromServer, listenerCount };
});

const sessionHarness = vi.hoisted(() => ({
  token: 'token-1',
  projectId: 'project-1',
}));

vi.mock('socket.io-client', () => ({ io: () => socketHarness.socket }));

vi.mock('@/lib/api', () => ({ API_BASE_URL: 'http://localhost:4200' }));

vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: {
    getToken: () => sessionHarness.token,
    getProjectId: () => sessionHarness.projectId,
  },
}));

import {
  SocketProvider,
  useSocket,
} from '@/components/providers/socket-provider';

describe('SocketProvider', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    sessionHarness.projectId = 'project-1';
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('keeps the connect listener of a mounted component when the project changes', async () => {
    const onConnect = vi.fn();
    await act(async () => root.render(<App onConnect={onConnect} />));

    sessionHarness.projectId = 'project-2';
    await act(async () => root.render(<App onConnect={onConnect} />));
    act(() => socketHarness.sendFromServer('connect'));

    expect(onConnect).toHaveBeenCalledTimes(1);
    expect(socketHarness.listenerCount('connect')).toBe(2);
    expect(socketHarness.listenerCount('disconnect')).toBe(1);
  });
});

function App({ onConnect }: { onConnect: () => void }) {
  return (
    <SocketProvider>
      <ConnectListener onConnect={onConnect} />
    </SocketProvider>
  );
}

function ConnectListener({ onConnect }: { onConnect: () => void }) {
  const socket = useSocket();
  useEffect(() => {
    socket.on('connect', onConnect);
    return () => {
      socket.off('connect', onConnect);
    };
  }, [socket, onConnect]);
  return null;
}
