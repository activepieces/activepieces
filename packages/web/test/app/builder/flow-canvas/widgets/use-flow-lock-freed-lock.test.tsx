// @vitest-environment jsdom
import {
  EmptyTrigger,
  FlowOperationStatus,
  FlowRun,
  FlowRunStatus,
  FlowStatus,
  FlowTriggerType,
  FlowVersion,
  FlowVersionState,
  PopulatedFlow,
  RunEnvironment,
  WebsocketClientEvent,
  WebsocketServerEvent,
} from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { io } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  BuilderStateContext,
  BuilderStore,
  createBuilderStore,
} from '@/app/builder/builder-hooks';
import { flowCanvasHooks } from '@/app/builder/flow-canvas/hooks';
import { useFlowLock } from '@/app/builder/flow-canvas/widgets/use-flow-lock';

const flowsApiMock = vi.hoisted(() => ({
  get: vi.fn<(flowId: string) => Promise<PopulatedFlow>>(),
  update: vi.fn(),
}));

const socketHarness = vi.hoisted(() => {
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
  const socket = {
    connected: true,
    on: (event: string, handler: ClientHandler) => {
      (handlers[event] ??= []).push(handler);
      return socket;
    },
    off: (event: string, handler: ClientHandler) => {
      handlers[event] = (handlers[event] ?? []).filter(
        (registered) => registered !== handler,
      );
      return socket;
    },
    emit: (
      event: string,
      payload: { resourceId: string; force?: boolean },
      ack?: (response: LockResponse) => void,
    ) => {
      emitCalls.push({ event, payload, ack });
      return socket;
    },
  };
  const sendFromServer = ({
    event,
    payload,
  }: {
    event: string;
    payload: unknown;
  }) => {
    (handlers[event] ?? []).forEach((handler) => handler(payload));
  };
  const reset = () => {
    emitCalls.length = 0;
    for (const key of Object.keys(handlers)) {
      delete handlers[key];
    }
  };
  return { socket, emitCalls, sendFromServer, reset };
});

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/features/flows/api/flows-api', () => ({
  flowsApi: flowsApiMock,
}));

vi.mock('@/components/providers/socket-provider', () => ({
  useSocket: () => socketHarness.socket,
}));

vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: {
    getCurrentUserId: () => 'viewer',
  },
}));

vi.mock('@/hooks/authorization-hooks', () => ({
  useAuthorization: () => ({ checkAccess: () => true }),
}));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => () => undefined,
}));

const HOLDER = { userId: 'holder', userDisplayName: 'Sam Lee' };
const THIRD_USER = { userId: 'third-user', userDisplayName: 'Kim Park' };

describe('useFlowLock when the holder frees the Resource Lock', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    socketHarness.reset();
    flowsApiMock.get.mockReset();
    flowsApiMock.update.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the saves of the holder, and after the holder leaves, takes the lock, shows the newest draft, then becomes editable', async () => {
    const store = createStore(draftFlow({ displayName: 'Order lookup' }));
    renderFlowLock(store);
    await answerLockRequest({ acquired: false, lock: HOLDER });
    expect(store.getState().readonly).toBe(true);

    flowsApiMock.get.mockResolvedValue(
      draftFlow({ displayName: 'Renamed by the holder' }),
    );
    await sendFromServer({
      event: WebsocketClientEvent.FLOW_DRAFT_UPDATED,
      payload: { flowId: 'flow-1', editorSessionId: 'holder-session' },
    });
    expect(store.getState()).toMatchObject({
      readonly: true,
      flowVersion: { displayName: 'Renamed by the holder' },
    });

    const lastSaveOfTheHolder = Promise.withResolvers<PopulatedFlow>();
    flowsApiMock.get.mockReturnValue(lastSaveOfTheHolder.promise);
    await holderLeaves();
    expect(lockRequests()).toHaveLength(2);
    await answerLockRequest({ acquired: true, lock: null });
    expect(flowsApiMock.get).toHaveBeenCalledTimes(2);
    expect(store.getState().readonly).toBe(true);

    lastSaveOfTheHolder.resolve(
      draftFlow({ displayName: 'Last save of the holder' }),
    );
    await settle();
    expect(store.getState()).toMatchObject({
      readonly: false,
      flowVersion: { displayName: 'Last save of the holder' },
    });
  });

  it('takes the freed lock and keeps a run read-only when the person opened the run while the holder edited', async () => {
    const store = createStore(draftFlow({ displayName: 'Order lookup' }));
    renderFlowLock(store);
    await answerLockRequest({ acquired: false, lock: HOLDER });
    act(() => {
      store.getState().setRun(flowRun(), store.getState().flowVersion);
    });

    await holderLeaves();
    await answerLockRequest({ acquired: true, lock: null });

    expect(store.getState()).toMatchObject({
      readonly: true,
      run: { id: 'run-1' },
    });
    expect(flowsApiMock.get).not.toHaveBeenCalled();
  });

  it('stays read-only and shows the user who took the freed lock first', async () => {
    const store = createStore(draftFlow({ displayName: 'Order lookup' }));
    const { result } = renderFlowLock(store);
    await answerLockRequest({ acquired: false, lock: HOLDER });

    await holderLeaves();
    await answerLockRequest({ acquired: false, lock: THIRD_USER });

    expect(result.current.lockedBy).toEqual(THIRD_USER);
    expect(store.getState().readonly).toBe(true);
    expect(flowsApiMock.get).not.toHaveBeenCalled();
  });

  it('shows the newest draft before it becomes editable when the server denies the freed lock and names no holder', async () => {
    const store = createStore(draftFlow({ displayName: 'Order lookup' }));
    const { result } = renderFlowLock(store);
    await answerLockRequest({ acquired: false, lock: HOLDER });
    flowsApiMock.get.mockResolvedValue(
      draftFlow({ displayName: 'Last save of the holder' }),
    );

    await holderLeaves();
    await answerLockRequest({ acquired: false, lock: null });

    expect(result.current.lockedBy).toBeNull();
    expect(store.getState()).toMatchObject({
      readonly: false,
      flowVersion: { displayName: 'Last save of the holder' },
    });
  });

  it('stays read-only and keeps the banner when the refresh fails', async () => {
    const store = createStore(draftFlow({ displayName: 'Order lookup' }));
    const { result } = renderFlowLock(store);
    await answerLockRequest({ acquired: false, lock: HOLDER });
    flowsApiMock.get.mockRejectedValue(new Error('Network Error'));

    await holderLeaves();
    await answerLockRequest({ acquired: true, lock: null });

    expect(result.current.lockedBy).toEqual(HOLDER);
    expect(store.getState().readonly).toBe(true);
  });

  it('takes the freed lock and keeps an older version read-only', async () => {
    const flow = draftFlow({ displayName: 'Order lookup' });
    const store = createStore(flow);
    renderFlowLock(store);
    await answerLockRequest({ acquired: false, lock: HOLDER });
    act(() => {
      store.getState().setVersion(olderVersion(flow));
      store.getState().setReadOnly(true);
    });

    await holderLeaves();
    await answerLockRequest({ acquired: true, lock: null });

    expect(store.getState()).toMatchObject({
      readonly: true,
      flowVersion: { id: 'version-1' },
    });
    expect(flowsApiMock.get).not.toHaveBeenCalled();
  });

  it('shows a draft that the holder made while the tab showed the published version, and makes the tab editable', async () => {
    const store = createStore(publishedFlowWithNoDraft());
    renderFlowLock(store);
    await answerLockRequest({ acquired: false, lock: HOLDER });
    flowsApiMock.get.mockResolvedValue(
      draftFlow({ displayName: 'New draft of the holder' }),
    );

    await holderLeaves();
    await answerLockRequest({ acquired: true, lock: null });

    expect(store.getState()).toMatchObject({
      readonly: false,
      flowVersion: {
        state: FlowVersionState.DRAFT,
        displayName: 'New draft of the holder',
      },
    });
  });

  it('keeps the published version read-only when the holder made no draft', async () => {
    const store = createStore(publishedFlowWithNoDraft());
    renderFlowLock(store);
    await answerLockRequest({ acquired: false, lock: HOLDER });
    flowsApiMock.get.mockResolvedValue(publishedFlowWithNoDraft());

    await holderLeaves();
    await answerLockRequest({ acquired: true, lock: null });

    expect(flowsApiMock.get).toHaveBeenCalledTimes(1);
    expect(store.getState()).toMatchObject({
      readonly: true,
      flowVersion: { state: FlowVersionState.LOCKED },
    });
  });
});

function renderFlowLock(store: BuilderStore) {
  return renderHook(
    () => {
      flowCanvasHooks.useRefreshDraftOnPush();
      return useFlowLock();
    },
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={new QueryClient()}>
          <BuilderStateContext.Provider value={store}>
            {children}
          </BuilderStateContext.Provider>
        </QueryClientProvider>
      ),
    },
  );
}

function lockRequests() {
  return socketHarness.emitCalls.filter(
    (call) => call.event === WebsocketServerEvent.LOCK_RESOURCE,
  );
}

async function answerLockRequest(response: {
  acquired: boolean;
  lock: { userId: string; userDisplayName: string } | null;
}) {
  const request = lockRequests().at(-1);
  await act(async () => {
    request?.ack?.(response);
  });
  await settle();
}

async function holderLeaves() {
  await sendFromServer({
    event: WebsocketClientEvent.RESOURCE_UNLOCKED,
    payload: { resourceId: 'flow-1' },
  });
}

async function sendFromServer({
  event,
  payload,
}: {
  event: string;
  payload: unknown;
}) {
  act(() => {
    socketHarness.sendFromServer({ event, payload });
  });
  await settle();
}

async function settle() {
  await act(() => vi.advanceTimersByTimeAsync(0));
}

function createStore(flow: PopulatedFlow): BuilderStore {
  return createBuilderStore({
    flow,
    flowVersion: flow.version,
    readonly: flow.version.state === FlowVersionState.LOCKED,
    hideTestWidget: false,
    run: null,
    outputSampleData: {},
    inputSampleData: {},
    socket: io({ autoConnect: false }),
    queryClient: new QueryClient(),
  });
}

function publishedFlowWithNoDraft(): PopulatedFlow {
  const flow = draftFlow({ displayName: 'Order lookup' });
  return {
    ...flow,
    publishedVersionId: 'version-1',
    version: olderVersion(flow),
  };
}

function olderVersion(flow: PopulatedFlow): FlowVersion {
  return { ...flow.version, id: 'version-1', state: FlowVersionState.LOCKED };
}

function flowRun(): FlowRun {
  return {
    id: 'run-1',
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    projectId: 'project-1',
    flowId: 'flow-1',
    flowVersionId: 'draft-1',
    failParentOnFailure: false,
    logsFileId: null,
    status: FlowRunStatus.SUCCEEDED,
    environment: RunEnvironment.TESTING,
    steps: {},
    tags: [],
    archivedAt: null,
  };
}

function draftFlow({ displayName }: { displayName: string }): PopulatedFlow {
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
      id: 'draft-1',
      created: '2026-01-01T00:00:00.000Z',
      updated: '2026-01-01T00:00:00.000Z',
      flowId: 'flow-1',
      displayName,
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
