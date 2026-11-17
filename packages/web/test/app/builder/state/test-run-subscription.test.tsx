// @vitest-environment jsdom
import {
  EmptyTrigger,
  FlowOperationStatus,
  FlowStatus,
  FlowTriggerType,
  FlowVersionState,
  PopulatedFlow,
  UpdateRunProgressRequest,
  WebsocketClientEvent,
} from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { io, Socket } from 'socket.io-client';
import { describe, expect, it, vi } from 'vitest';

import { BuilderStore, createBuilderStore } from '@/app/builder/builder-hooks';
import { useSocket } from '@/components/providers/socket-provider';
import { flowHooks } from '@/features/flows';

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('i18next', () => ({ t: (key: string) => key }));

const FLOW_VERSION_ID = 'draft-1';

describe('test run subscription', () => {
  it('aborts the previous subscription when a new one starts', () => {
    const store = createStore();

    const first = store.getState().startTestRunSubscription();
    const second = store.getState().startTestRunSubscription();

    expect(first.aborted).toBe(true);
    expect(second.aborted).toBe(false);
  });

  it('keeps following a test run after the canvas remounts the test widget, until the builder aborts it', async () => {
    const store = createStore();
    const onUpdate = vi.fn<(response: UpdateRunProgressRequest) => void>();
    const harness: WidgetHarness = { start: null, socket: null };
    const root = createRoot(document.createElement('div'));
    await act(async () => {
      root.render(
        <QueryClientProvider client={new QueryClient()}>
          <TestWidget harness={harness} onUpdate={onUpdate} />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      harness.start?.(store.getState().startTestRunSubscription());
    });
    await act(async () => {
      emitToClient({
        socket: harness.socket,
        event: WebsocketClientEvent.TEST_FLOW_RUN_STARTED,
        payload: { id: 'run-1', flowVersionId: FLOW_VERSION_ID },
      });
    });
    act(() => root.unmount());
    emitToClient({
      socket: harness.socket,
      event: WebsocketClientEvent.UPDATE_RUN_PROGRESS,
      payload: { flowRun: { id: 'run-1' } },
    });

    expect(onUpdate).toHaveBeenCalledTimes(2);

    store.getState().abortTestRunSubscription();
    emitToClient({
      socket: harness.socket,
      event: WebsocketClientEvent.UPDATE_RUN_PROGRESS,
      payload: { flowRun: { id: 'run-1' } },
    });

    expect(onUpdate).toHaveBeenCalledTimes(2);
    expect(
      harness.socket?.listeners(WebsocketClientEvent.UPDATE_RUN_PROGRESS),
    ).toHaveLength(0);
  });
});

function TestWidget({
  harness,
  onUpdate,
}: {
  harness: WidgetHarness;
  onUpdate: (response: UpdateRunProgressRequest) => void;
}) {
  const socket = useSocket();
  const { mutate } = flowHooks.useTestFlowOrStartManualTrigger({
    flowVersionId: FLOW_VERSION_ID,
    onUpdateRun: onUpdate,
    isForManualTrigger: false,
  });
  useEffect(() => {
    harness.start = mutate;
    harness.socket = socket;
  }, [harness, mutate, socket]);
  return null;
}

function emitToClient({
  socket,
  event,
  payload,
}: {
  socket: Socket | null;
  event: string;
  payload: unknown;
}) {
  socket?.listeners(event).forEach((handler) => handler(payload));
}

function createStore(): BuilderStore {
  const flow = draftFlow();
  return createBuilderStore({
    flow,
    flowVersion: flow.version,
    readonly: false,
    hideTestWidget: false,
    run: null,
    outputSampleData: {},
    inputSampleData: {},
    socket: io({ autoConnect: false }),
    queryClient: new QueryClient(),
  });
}

function draftFlow(): PopulatedFlow {
  const trigger: EmptyTrigger = {
    name: 'trigger',
    valid: false,
    displayName: 'Select Trigger',
    type: FlowTriggerType.EMPTY,
    settings: {},
    lastUpdatedDate: '2026-01-01T00:00:00.000Z',
  };
  return {
    id: 'flow-1',
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    projectId: 'project-1',
    externalId: 'flow-1',
    ownerId: null,
    folderId: null,
    status: FlowStatus.DISABLED,
    publishedVersionId: null,
    metadata: null,
    operationStatus: FlowOperationStatus.NONE,
    timeSavedPerRun: null,
    templateId: null,
    createdBy: null,
    version: {
      id: FLOW_VERSION_ID,
      created: '2026-01-01T00:00:00.000Z',
      updated: '2026-01-01T00:00:00.000Z',
      flowId: 'flow-1',
      displayName: 'Test run subscription',
      trigger,
      updatedBy: null,
      valid: false,
      schemaVersion: null,
      agentIds: [],
      state: FlowVersionState.DRAFT,
      connectionIds: [],
      backupFiles: null,
      notes: [],
    },
  };
}

type WidgetHarness = {
  start: ((signal: AbortSignal) => void) | null;
  socket: Socket | null;
};
