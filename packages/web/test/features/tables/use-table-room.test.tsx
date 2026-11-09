// @vitest-environment jsdom
import { WebsocketServerEvent } from '@activepieces/shared';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const socketHarness = vi.hoisted(() => {
  const handlers = new Map<string, () => void>();
  const emitted: { event: string; payload: unknown }[] = [];
  const held: (() => void)[] = [];
  const socket = {
    on: (event: string, handler: () => void) => handlers.set(event, handler),
    off: (event: string) => handlers.delete(event),
    emit: (event: string, payload: unknown) => {
      emitted.push({ event, payload });
      return socket;
    },
  };
  const emitInProject = (send: () => void) => {
    held.push(send);
  };
  const releaseHeld = () => held.splice(0).forEach((send) => send());
  const reset = () => {
    handlers.clear();
    emitted.length = 0;
    held.length = 0;
  };
  return { socket, handlers, emitted, emitInProject, releaseHeld, reset };
});

vi.mock('@/components/providers/socket-provider', () => ({
  useSocket: () => socketHarness.socket,
  emitInProject: socketHarness.emitInProject,
}));

import { useTableRoom } from '@/features/tables/hooks/use-table-room';

describe('useTableRoom', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    socketHarness.reset();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('joins the table room once the project is ready and leaves it on unmount', async () => {
    await act(async () => root.render(<TablePage tableId="table-1" />));

    expect(socketHarness.emitted).toEqual([]);

    act(() => socketHarness.releaseHeld());
    act(() => root.unmount());

    expect(socketHarness.emitted).toEqual([
      {
        event: WebsocketServerEvent.JOIN_TABLE_ROOM,
        payload: { tableId: 'table-1' },
      },
      {
        event: WebsocketServerEvent.LEAVE_TABLE_ROOM,
        payload: { tableId: 'table-1' },
      },
    ]);
  });

  it('joins the room again after the socket reconnects', async () => {
    await act(async () => root.render(<TablePage tableId="table-1" />));
    act(() => socketHarness.releaseHeld());

    act(() => socketHarness.handlers.get('connect')?.());
    act(() => socketHarness.releaseHeld());

    expect(socketHarness.emitted.map(({ event }) => event)).toEqual([
      WebsocketServerEvent.JOIN_TABLE_ROOM,
      WebsocketServerEvent.JOIN_TABLE_ROOM,
    ]);
    act(() => root.unmount());
  });
});

function TablePage({ tableId }: { tableId: string }) {
  useTableRoom({ tableId });
  return null;
}
