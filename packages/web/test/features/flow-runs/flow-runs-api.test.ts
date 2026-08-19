import { WebsocketClientEvent } from '@activepieces/shared';
import { Socket } from 'socket.io-client';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { flowRunsApi } from '@/features/flow-runs/api/flow-runs-api';

const FLOW_VERSION_ID = 'flow-version-1';

describe('flowRunsApi.subscribeToTestFlowOrManualRun', () => {
  it('registers no progress listener when aborted before the run starts', async () => {
    const socket = createFakeSocket();
    const onUpdate = vi.fn();
    const controller = new AbortController();

    void flowRunsApi.subscribeToTestFlowOrManualRun({
      socket: socket.asSocket,
      request: { flowVersionId: FLOW_VERSION_ID },
      onUpdate,
      isForManualTrigger: false,
      signal: controller.signal,
    });

    controller.abort();
    socket.emitToClient(WebsocketClientEvent.TEST_FLOW_RUN_STARTED, {
      id: 'run-1',
      flowVersionId: FLOW_VERSION_ID,
    });
    await Promise.resolve();

    expect(socket.listenerCount(WebsocketClientEvent.TEST_FLOW_RUN_STARTED)).toBe(0);
    expect(socket.listenerCount(WebsocketClientEvent.UPDATE_RUN_PROGRESS)).toBe(0);
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('stops streaming progress once aborted after the run started', async () => {
    const socket = createFakeSocket();
    const onUpdate = vi.fn();
    const controller = new AbortController();

    const subscription = flowRunsApi.subscribeToTestFlowOrManualRun({
      socket: socket.asSocket,
      request: { flowVersionId: FLOW_VERSION_ID },
      onUpdate,
      isForManualTrigger: false,
      signal: controller.signal,
    });
    socket.emitToClient(WebsocketClientEvent.TEST_FLOW_RUN_STARTED, {
      id: 'run-1',
      flowVersionId: FLOW_VERSION_ID,
    });
    await subscription;

    controller.abort();
    socket.emitToClient(WebsocketClientEvent.UPDATE_RUN_PROGRESS, {
      flowRun: { id: 'run-1' },
    });

    expect(socket.listenerCount(WebsocketClientEvent.UPDATE_RUN_PROGRESS)).toBe(0);
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });

  it('streams progress for its own run and ignores another run', async () => {
    const socket = createFakeSocket();
    const onUpdate = vi.fn();

    const subscription = flowRunsApi.subscribeToTestFlowOrManualRun({
      socket: socket.asSocket,
      request: { flowVersionId: FLOW_VERSION_ID },
      onUpdate,
      isForManualTrigger: false,
      signal: new AbortController().signal,
    });
    socket.emitToClient(WebsocketClientEvent.TEST_FLOW_RUN_STARTED, {
      id: 'run-1',
      flowVersionId: FLOW_VERSION_ID,
    });
    await subscription;

    socket.emitToClient(WebsocketClientEvent.UPDATE_RUN_PROGRESS, {
      flowRun: { id: 'run-2' },
    });
    socket.emitToClient(WebsocketClientEvent.UPDATE_RUN_PROGRESS, {
      flowRun: { id: 'run-1', finishTime: '2026-08-19T00:00:00.000Z' },
    });

    expect(onUpdate).toHaveBeenCalledTimes(2);
    expect(onUpdate).toHaveBeenLastCalledWith({
      flowRun: { id: 'run-1', finishTime: '2026-08-19T00:00:00.000Z' },
    });
    expect(socket.listenerCount(WebsocketClientEvent.UPDATE_RUN_PROGRESS)).toBe(0);
  });
});

function createFakeSocket() {
  const listeners = new Map<string, ((payload: unknown) => void)[]>();
  const fakeSocket = {
    emit: () => fakeSocket,
    on: (event: string, handler: (payload: unknown) => void) => {
      listeners.set(event, [...(listeners.get(event) ?? []), handler]);
      return fakeSocket;
    },
    off: (event: string, handler: (payload: unknown) => void) => {
      listeners.set(
        event,
        (listeners.get(event) ?? []).filter(
          (registered) => registered !== handler,
        ),
      );
      return fakeSocket;
    },
  };
  return {
    asSocket: fakeSocket as unknown as Socket,
    emitToClient: (event: string, payload: unknown) =>
      [...(listeners.get(event) ?? [])].forEach((handler) => handler(payload)),
    listenerCount: (event: string) => (listeners.get(event) ?? []).length,
  };
}
