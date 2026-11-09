// @vitest-environment jsdom
import { WebsocketServerEvent } from '@activepieces/shared';
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
  type Ack = (error: Error | null, response?: unknown) => void;
  type AuthOption = (send: (data: object) => void) => void;
  const handlers: Record<string, Handler[]> = {};
  const emitted: {
    event: string;
    payload: unknown;
    ack: Ack;
    timeoutMs: number | null;
  }[] = [];
  const state: { auth: AuthOption | null; handshakes: object[] } = {
    auth: null,
    handshakes: [],
  };
  const pendingTimeout: { ms: number | null } = { ms: null };
  const socket = {
    connected: false,
    active: false,
    connect: () => {
      socket.active = true;
      socket.connected = true;
      state.auth?.((data) => state.handshakes.push(data));
      return socket;
    },
    disconnect: () => {
      socket.active = false;
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
    timeout: (ms: number) => {
      pendingTimeout.ms = ms;
      return socket;
    },
    emit: (event: string, payload: unknown, ack: Ack) => {
      emitted.push({ event, payload, ack, timeoutMs: pendingTimeout.ms });
      pendingTimeout.ms = null;
      return socket;
    },
  };
  const sendFromServer = (event: string) => {
    (handlers[event] ?? []).forEach((handler) => handler());
  };
  const listenerCount = (event: string) => (handlers[event] ?? []).length;
  const reset = () => {
    emitted.length = 0;
    state.handshakes.length = 0;
  };
  return { socket, state, emitted, sendFromServer, listenerCount, reset };
});

const sessionHarness = vi.hoisted(
  (): { token: string; projectId: string | null } => ({
    token: 'token-1',
    projectId: 'project-1',
  }),
);

const toastHarness = vi.hoisted(() => {
  const toast = Object.assign(() => undefined, {
    dismiss: () => undefined,
    error: (..._args: unknown[]) => undefined,
  });
  return { toast };
});

vi.mock('socket.io-client', () => ({
  io: (_url: string, options: { auth: typeof socketHarness.state.auth }) => {
    socketHarness.state.auth = options.auth;
    return socketHarness.socket;
  },
}));

vi.mock('sonner', () => ({ toast: toastHarness.toast }));

vi.mock('@/lib/api', () => ({ API_BASE_URL: 'http://localhost:4200' }));

vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: {
    getToken: () => sessionHarness.token,
    subscribe: () => () => undefined,
  },
}));

vi.mock('@/hooks/use-session-project-id', () => ({
  useSessionProjectId: () => sessionHarness.projectId,
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
    socketHarness.reset();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
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

  it('switches project on the open socket instead of reconnecting', async () => {
    await act(async () => root.render(<App onConnect={vi.fn()} />));
    const disconnect = vi.spyOn(socketHarness.socket, 'disconnect');

    sessionHarness.projectId = 'project-2';
    await act(async () => root.render(<App onConnect={vi.fn()} />));

    expect(disconnect).not.toHaveBeenCalled();
    expect(socketHarness.state.handshakes).toEqual([
      { token: 'token-1', projectId: 'project-1' },
    ]);
    expect(socketHarness.emitted).toHaveLength(1);
    expect(socketHarness.emitted[0].event).toBe(
      WebsocketServerEvent.SWITCH_PROJECT,
    );
    expect(socketHarness.emitted[0].payload).toEqual({
      projectId: 'project-2',
    });
  });

  it('shows an error and does not retry when the server rejects the switch', async () => {
    const showError = vi.spyOn(toastHarness.toast, 'error');
    await act(async () => root.render(<App onConnect={vi.fn()} />));

    sessionHarness.projectId = 'project-2';
    await act(async () => root.render(<App onConnect={vi.fn()} />));
    act(() => socketHarness.emitted[0].ack(null, { success: false }));
    await act(async () => root.render(<App onConnect={vi.fn()} />));

    expect(showError).toHaveBeenCalledTimes(1);
    expect(socketHarness.emitted).toHaveLength(1);
  });

  it('treats a switch the server never answers as an error and does not retry', async () => {
    const showError = vi.spyOn(toastHarness.toast, 'error');
    await act(async () => root.render(<App onConnect={vi.fn()} />));

    sessionHarness.projectId = 'project-2';
    await act(async () => root.render(<App onConnect={vi.fn()} />));
    expect(socketHarness.emitted[0].timeoutMs).not.toBeNull();
    act(() =>
      socketHarness.emitted[0].ack(new Error('operation has timed out')),
    );
    await act(async () => root.render(<App onConnect={vi.fn()} />));

    expect(showError).toHaveBeenCalledTimes(1);
    expect(socketHarness.emitted).toHaveLength(1);
  });

  it('switches again after an unanswered switch to another project', async () => {
    await act(async () => root.render(<App onConnect={vi.fn()} />));

    sessionHarness.projectId = 'project-2';
    await act(async () => root.render(<App onConnect={vi.fn()} />));
    act(() =>
      socketHarness.emitted[0].ack(new Error('operation has timed out')),
    );
    sessionHarness.projectId = 'project-3';
    await act(async () => root.render(<App onConnect={vi.fn()} />));

    expect(socketHarness.emitted).toHaveLength(2);
    expect(socketHarness.emitted[1].payload).toEqual({
      projectId: 'project-3',
    });
  });

  it('connects with the token alone on pages without a project', async () => {
    sessionHarness.projectId = null;
    await act(async () => root.render(<App onConnect={vi.fn()} />));

    expect(socketHarness.socket.connected).toBe(true);
    expect(socketHarness.state.handshakes).toEqual([
      { token: 'token-1', projectId: null },
    ]);
    expect(socketHarness.emitted).toHaveLength(0);
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
