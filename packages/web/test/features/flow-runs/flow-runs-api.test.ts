import { WebsocketClientEvent } from '@activepieces/shared';
import { io } from 'socket.io-client';
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
    const fakeSocket = createFakeSocket();
    const onUpdate = vi.fn();
    const controller = new AbortController();

    const subscription = flowRunsApi.subscribeToTestFlowOrManualRun({
      socket: fakeSocket.socket,
      request: { flowVersionId: FLOW_VERSION_ID },
      onUpdate,
      isForManualTrigger: false,
      signal: controller.signal,
    });

    controller.abort();
    fakeSocket.emitToClient(WebsocketClientEvent.TEST_FLOW_RUN_STARTED, {
      id: 'run-1',
      flowVersionId: FLOW_VERSION_ID,
    });
    await subscription;

    expect(
      fakeSocket.listenerCount(WebsocketClientEvent.TEST_FLOW_RUN_STARTED),
    ).toBe(0);
    expect(
      fakeSocket.listenerCount(WebsocketClientEvent.UPDATE_RUN_PROGRESS),
    ).toBe(0);
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('settles when aborted before a run that never starts, so the caller does not stay pending', async () => {
    const fakeSocket = createFakeSocket();
    const controller = new AbortController();

    const subscription = flowRunsApi.subscribeToTestFlowOrManualRun({
      socket: fakeSocket.socket,
      request: { flowVersionId: FLOW_VERSION_ID },
      onUpdate: vi.fn(),
      isForManualTrigger: true,
      signal: controller.signal,
    });
    controller.abort();

    await expect(subscription).resolves.toBeUndefined();
    expect(
      fakeSocket.listenerCount(WebsocketClientEvent.MANUAL_TRIGGER_RUN_STARTED),
    ).toBe(0);
  });

  it('stops streaming progress once aborted after the run started', async () => {
    const fakeSocket = createFakeSocket();
    const onUpdate = vi.fn();
    const controller = new AbortController();

    const subscription = flowRunsApi.subscribeToTestFlowOrManualRun({
      socket: fakeSocket.socket,
      request: { flowVersionId: FLOW_VERSION_ID },
      onUpdate,
      isForManualTrigger: false,
      signal: controller.signal,
    });
    fakeSocket.emitToClient(WebsocketClientEvent.TEST_FLOW_RUN_STARTED, {
      id: 'run-1',
      flowVersionId: FLOW_VERSION_ID,
    });
    await subscription;

    controller.abort();
    fakeSocket.emitToClient(WebsocketClientEvent.UPDATE_RUN_PROGRESS, {
      flowRun: { id: 'run-1' },
    });

    expect(
      fakeSocket.listenerCount(WebsocketClientEvent.UPDATE_RUN_PROGRESS),
    ).toBe(0);
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });

  it('streams progress for its own run and ignores another run', async () => {
    const fakeSocket = createFakeSocket();
    const onUpdate = vi.fn();

    const subscription = flowRunsApi.subscribeToTestFlowOrManualRun({
      socket: fakeSocket.socket,
      request: { flowVersionId: FLOW_VERSION_ID },
      onUpdate,
      isForManualTrigger: false,
      signal: new AbortController().signal,
    });
    fakeSocket.emitToClient(WebsocketClientEvent.TEST_FLOW_RUN_STARTED, {
      id: 'run-1',
      flowVersionId: FLOW_VERSION_ID,
    });
    await subscription;

    fakeSocket.emitToClient(WebsocketClientEvent.UPDATE_RUN_PROGRESS, {
      flowRun: { id: 'run-2' },
    });
    fakeSocket.emitToClient(WebsocketClientEvent.UPDATE_RUN_PROGRESS, {
      flowRun: { id: 'run-1', finishTime: '2026-08-19T00:00:00.000Z' },
    });

    expect(onUpdate).toHaveBeenCalledTimes(2);
    expect(onUpdate).toHaveBeenLastCalledWith({
      flowRun: { id: 'run-1', finishTime: '2026-08-19T00:00:00.000Z' },
    });
    expect(
      fakeSocket.listenerCount(WebsocketClientEvent.UPDATE_RUN_PROGRESS),
    ).toBe(0);
  });
});

function createFakeSocket() {
  const socket = io('http://localhost', { autoConnect: false });
  return {
    socket,
    emitToClient: (event: string, payload: unknown) =>
      socket.listeners(event).forEach((handler) => handler(payload)),
    listenerCount: (event: string) => socket.listeners(event).length,
  };
}
