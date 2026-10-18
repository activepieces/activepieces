// @vitest-environment jsdom
import {
  EmptyTrigger,
  FlowOperationRequest,
  FlowDraftUpdatedEvent,
  FlowOperationStatus,
  FlowOperationType,
  FlowRun,
  FlowRunStatus,
  FlowStatus,
  FlowTriggerType,
  FlowVersion,
  FlowVersionState,
  Note,
  NoteColorVariant,
  PopulatedFlow,
  RunEnvironment,
  WebsocketClientEvent,
} from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { io } from 'socket.io-client';
import { Toaster, toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  BuilderStateContext,
  BuilderStore,
  createBuilderStore,
} from '@/app/builder/builder-hooks';
import { flowCanvasHooks } from '@/app/builder/flow-canvas/hooks';
import { useFlowLock } from '@/app/builder/flow-canvas/widgets/use-flow-lock';
import { editorSession } from '@/lib/editor-session';

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const flowsApiMock = vi.hoisted(() => ({
  update:
    vi.fn<
      (
        flowId: string,
        operation: FlowOperationRequest,
      ) => Promise<PopulatedFlow>
    >(),
  get: vi.fn<(flowId: string) => Promise<PopulatedFlow>>(),
}));

const socketHarness = vi.hoisted(() => {
  type ClientHandler = (payload: unknown) => void;
  const handlers: Record<string, ClientHandler[]> = {};
  const socket = {
    connected: false,
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
    for (const key of Object.keys(handlers)) {
      delete handlers[key];
    }
    socket.connected = false;
  };
  return { socket, sendFromServer, reset };
});

const authorizationHarness = vi.hoisted(() => ({ canEditFlow: true }));

const lockHarness = vi.hoisted((): { lockedBy: LockHolder | null } => ({
  lockedBy: null,
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/hooks/use-resource-lock', () => ({
  useResourceLock: () => ({
    lockedBy: lockHarness.lockedBy,
    takeOver: () => undefined,
  }),
}));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => () => undefined,
}));

vi.mock('@/hooks/authorization-hooks', () => ({
  useAuthorization: () => ({
    checkAccess: () => authorizationHarness.canEditFlow,
  }),
}));

vi.mock('@/components/providers/socket-provider', () => ({
  useSocket: () => socketHarness.socket,
}));

vi.mock('@/features/flows/api/flows-api', () => ({
  flowsApi: flowsApiMock,
}));

describe('useFlushPendingEditsOnLeave', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    flowsApiMock.update.mockReset();
    flowsApiMock.update.mockResolvedValue(
      flowWithDraftVersion({ versionId: 'draft-1' }),
    );
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('sends a pending edit when the tab becomes hidden', async () => {
    const store = createStore(flowWithDraftVersion({ versionId: 'draft-1' }));
    mount(store);

    store.getState().applyOperation(renameTrigger('New order'));
    hideTab();
    await vi.advanceTimersByTimeAsync(0);

    expect(sentOperations()).toEqual([renameTrigger('New order')]);
  });

  it('sends a pending edit when the builder unmounts, and the save completes after it', async () => {
    const save = Promise.withResolvers<PopulatedFlow>();
    flowsApiMock.update.mockReturnValue(save.promise);
    const store = createStore(flowWithDraftVersion({ versionId: 'draft-1' }));
    mount(store);

    store.getState().applyOperation(renameTrigger('New order'));
    act(() => root.unmount());
    await vi.advanceTimersByTimeAsync(0);
    expect(sentOperations()).toEqual([renameTrigger('New order')]);

    save.resolve(flowWithDraftVersion({ versionId: 'draft-2' }));
    await vi.advanceTimersByTimeAsync(0);
    expect(store.getState().flowVersion.id).toBe('draft-2');
    expect(store.getState().saving).toBe(false);
  });

  function mount(store: BuilderStore) {
    act(() => {
      root.render(
        <BuilderStateContext.Provider value={store}>
          <LeaveWatcher />
        </BuilderStateContext.Provider>,
      );
    });
  }
});

describe('useRefreshDraftOnPush', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    socketHarness.reset();
    authorizationHarness.canEditFlow = true;
    lockHarness.lockedBy = null;
    flowsApiMock.update.mockReset();
    flowsApiMock.get.mockReset();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('shows the newest draft after a push from a different Editor Session, with no toast', async () => {
    const store = createStore(flowWithDraftVersion({ versionId: 'draft-1' }));
    flowsApiMock.get.mockResolvedValue(
      flowWithDraftVersion({
        versionId: 'draft-1',
        displayName: 'Renamed in a different tab',
      }),
    );
    mount(store);

    sendDraftPush({ flowId: 'flow-1', editorSessionId: 'other-session' });
    await vi.advanceTimersByTimeAsync(0);

    expect(flowsApiMock.get).toHaveBeenCalledWith('flow-1');
    expect(store.getState().flowVersion.displayName).toBe(
      'Renamed in a different tab',
    );
    expect(shownToasts()).toHaveLength(0);
  });

  it('ignores a push with the Editor Session id of the tab', async () => {
    const store = createStore(flowWithDraftVersion({ versionId: 'draft-1' }));
    mount(store);

    sendDraftPush({
      flowId: 'flow-1',
      editorSessionId: editorSession.getId(),
    });
    await vi.advanceTimersByTimeAsync(0);

    expect(flowsApiMock.get).not.toHaveBeenCalled();
  });

  it('ignores a push for a different flow', async () => {
    const store = createStore(flowWithDraftVersion({ versionId: 'draft-1' }));
    mount(store);

    sendDraftPush({ flowId: 'flow-2', editorSessionId: 'other-session' });
    await vi.advanceTimersByTimeAsync(0);

    expect(flowsApiMock.get).not.toHaveBeenCalled();
  });

  it('shows the newest draft after a push with no Editor Session id', async () => {
    const store = createStore(flowWithDraftVersion({ versionId: 'draft-1' }));
    flowsApiMock.get.mockResolvedValue(
      flowWithDraftVersion({
        versionId: 'draft-1',
        displayName: 'Renamed by an agent',
      }),
    );
    mount(store);

    sendDraftPush({ flowId: 'flow-1', editorSessionId: null });
    await vi.advanceTimersByTimeAsync(0);

    expect(store.getState().flowVersion.displayName).toBe(
      'Renamed by an agent',
    );
  });

  it('fetches the draft only after the save of the pending edit ends, then shows the fetched draft', async () => {
    const save = Promise.withResolvers<PopulatedFlow>();
    flowsApiMock.update.mockReturnValue(save.promise);
    flowsApiMock.get.mockResolvedValue(
      flowWithDraftVersion({
        versionId: 'draft-1',
        displayName: 'Renamed in a different tab',
      }),
    );
    const store = createStore(flowWithDraftVersion({ versionId: 'draft-1' }));
    mount(store);

    store.getState().applyOperation(renameTrigger('New order'));
    sendDraftPush({ flowId: 'flow-1', editorSessionId: 'other-session' });
    await vi.advanceTimersByTimeAsync(0);
    expect(sentOperations()).toEqual([renameTrigger('New order')]);
    expect(flowsApiMock.get).not.toHaveBeenCalled();

    save.resolve(flowWithDraftVersion({ versionId: 'draft-1' }));
    await vi.advanceTimersByTimeAsync(0);
    expect(flowsApiMock.get).toHaveBeenCalledWith('flow-1');
    expect(store.getState().flowVersion.displayName).toBe(
      'Renamed in a different tab',
    );
  });

  it('sends two GETs for a chat that saves six times in 12 s', async () => {
    const store = createStore(flowWithDraftVersion({ versionId: 'draft-1' }));
    const firstResponse = Promise.withResolvers<void>();
    let agentSaves = 0;
    flowsApiMock.get.mockImplementation(async () => {
      const draft = flowWithDraftVersion({
        versionId: 'draft-1',
        notes: agentNotes(agentSaves),
      });
      await firstResponse.promise;
      return draft;
    });
    mount(store);

    for (let save = 1; save <= 6; save++) {
      agentSaves = save;
      sendDraftPush({ flowId: 'flow-1', editorSessionId: null });
      await vi.advanceTimersByTimeAsync(2000);
    }
    expect(flowsApiMock.get).toHaveBeenCalledTimes(1);

    firstResponse.resolve();
    await vi.advanceTimersByTimeAsync(0);

    expect(flowsApiMock.get).toHaveBeenCalledTimes(2);
    expect(
      store.getState().flowVersion.notes.map((note) => note.content),
    ).toEqual([
      'Agent save 1',
      'Agent save 2',
      'Agent save 3',
      'Agent save 4',
      'Agent save 5',
      'Agent save 6',
    ]);
  });

  it('ignores a push while the tab shows a run', async () => {
    const store = createStore(flowWithDraftVersion({ versionId: 'draft-1' }));
    store.getState().setRun(testRun(), store.getState().flowVersion);
    mount(store);

    sendDraftPush({ flowId: 'flow-1', editorSessionId: 'other-session' });
    await vi.advanceTimersByTimeAsync(0);

    expect(flowsApiMock.get).not.toHaveBeenCalled();
  });

  it('ignores a push while the tab shows an older version', async () => {
    const flow = flowWithDraftVersion({ versionId: 'draft-1' });
    const store = createStore(flow);
    store
      .getState()
      .setVersion(lockedVersion({ flow, versionId: 'version-1' }));
    mount(store);

    sendDraftPush({ flowId: 'flow-1', editorSessionId: 'other-session' });
    await vi.advanceTimersByTimeAsync(0);

    expect(flowsApiMock.get).not.toHaveBeenCalled();
    expect(store.getState().flowVersion.id).toBe('version-1');
  });

  it('shows the new draft in a read-only tab on the published version with no draft, and makes the tab editable', async () => {
    const store = createStore(publishedFlowWithNoDraft());
    store.getState().setReadOnly(true);
    flowsApiMock.get.mockResolvedValue(
      flowWithDraftVersion({
        versionId: 'draft-1',
        displayName: 'Changed by an agent',
      }),
    );
    mount(store);

    sendDraftPush({ flowId: 'flow-1', editorSessionId: null });
    await vi.advanceTimersByTimeAsync(0);

    expect(store.getState()).toMatchObject({
      readonly: false,
      flowVersion: { id: 'draft-1', displayName: 'Changed by an agent' },
    });
  });

  it('keeps the tab read-only for a person who cannot edit the flow when a new draft arrives', async () => {
    authorizationHarness.canEditFlow = false;
    const store = createStore(publishedFlowWithNoDraft());
    store.getState().setReadOnly(true);
    flowsApiMock.get.mockResolvedValue(
      flowWithDraftVersion({ versionId: 'draft-1' }),
    );
    mount(store);

    sendDraftPush({ flowId: 'flow-1', editorSessionId: null });
    await vi.advanceTimersByTimeAsync(0);

    expect(store.getState()).toMatchObject({
      readonly: true,
      flowVersion: { id: 'draft-1' },
    });
  });

  it('keeps the tab read-only while a different user holds the lock and a new draft arrives', async () => {
    lockHarness.lockedBy = { userId: 'user-2', userDisplayName: 'Sam Lee' };
    const store = createStore(publishedFlowWithNoDraft());
    store.getState().setReadOnly(true);
    flowsApiMock.get.mockResolvedValue(
      flowWithDraftVersion({ versionId: 'draft-1' }),
    );
    act(() => {
      root.render(
        <QueryClientProvider client={new QueryClient()}>
          <BuilderStateContext.Provider value={store}>
            <DraftPushWatcherWithFlowLock />
          </BuilderStateContext.Provider>
        </QueryClientProvider>,
      );
    });

    sendDraftPush({ flowId: 'flow-1', editorSessionId: null });
    await vi.advanceTimersByTimeAsync(0);

    expect(store.getState()).toMatchObject({
      readonly: true,
      flowVersion: { id: 'draft-1' },
    });
  });

  it('shows the error toast when the fetch fails', async () => {
    const store = createStore(flowWithDraftVersion({ versionId: 'draft-1' }));
    flowsApiMock.get.mockRejectedValue(new Error('Network Error'));
    vi.spyOn(toast, 'error');
    mount(store);

    sendDraftPush({ flowId: 'flow-1', editorSessionId: 'other-session' });
    await vi.advanceTimersByTimeAsync(0);

    expect(toast.error).toHaveBeenCalledWith(
      'Something went wrong',
      expect.anything(),
    );
    expect(store.getState().flowVersion.displayName).toBe('Order lookup');
  });

  function mount(store: BuilderStore) {
    act(() => {
      root.render(
        <BuilderStateContext.Provider value={store}>
          <DraftPushWatcher />
          <Toaster />
        </BuilderStateContext.Provider>,
      );
    });
  }
});

describe('useRefreshDraftOnReconnectAndReturn', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    socketHarness.reset();
    authorizationHarness.canEditFlow = true;
    flowsApiMock.update.mockReset();
    flowsApiMock.get.mockReset();
    flowsApiMock.get.mockResolvedValue(
      flowWithDraftVersion({
        versionId: 'draft-1',
        displayName: 'Renamed while the tab was away',
      }),
    );
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('shows the newest draft after a socket reconnect, with no toast', async () => {
    socketHarness.socket.connected = true;
    const store = createStore(flowWithDraftVersion({ versionId: 'draft-1' }));
    mount(store);

    connectSocket();
    await vi.advanceTimersByTimeAsync(0);

    expect(flowsApiMock.get).toHaveBeenCalledWith('flow-1');
    expect(store.getState().flowVersion.displayName).toBe(
      'Renamed while the tab was away',
    );
    expect(shownToasts()).toHaveLength(0);
  });

  it('shows a draft saved before the first connect of a page load', async () => {
    const store = createStore(flowWithDraftVersion({ versionId: 'draft-1' }));
    mount(store);

    connectSocket();
    await vi.advanceTimersByTimeAsync(0);

    expect(flowsApiMock.get).toHaveBeenCalledTimes(1);
    expect(store.getState().flowVersion.displayName).toBe(
      'Renamed while the tab was away',
    );
  });

  it('shows the newest draft when the tab becomes visible again, with no toast', async () => {
    const store = createStore(flowWithDraftVersion({ versionId: 'draft-1' }));
    mount(store);

    showTab();
    await vi.advanceTimersByTimeAsync(0);

    expect(flowsApiMock.get).toHaveBeenCalledWith('flow-1');
    expect(store.getState().flowVersion.displayName).toBe(
      'Renamed while the tab was away',
    );
    expect(shownToasts()).toHaveLength(0);
  });

  it('does not refresh a run view when the tab becomes visible again', async () => {
    const store = createStore(flowWithDraftVersion({ versionId: 'draft-1' }));
    store.getState().setRun(testRun(), store.getState().flowVersion);
    mount(store);

    showTab();
    await vi.advanceTimersByTimeAsync(0);

    expect(flowsApiMock.get).not.toHaveBeenCalled();
    expect(store.getState().flowVersion.displayName).toBe('Order lookup');
  });

  it('shows a new draft in a read-only tab on the published version when the tab becomes visible again, and makes the tab editable', async () => {
    const store = createStore(publishedFlowWithNoDraft());
    store.getState().setReadOnly(true);
    mount(store);

    showTab();
    await vi.advanceTimersByTimeAsync(0);

    expect(store.getState()).toMatchObject({
      readonly: false,
      flowVersion: { id: 'draft-1' },
    });
  });

  it('does not refresh an older version on a socket reconnect', async () => {
    socketHarness.socket.connected = true;
    const flow = flowWithDraftVersion({ versionId: 'draft-1' });
    const store = createStore(flow);
    store
      .getState()
      .setVersion(lockedVersion({ flow, versionId: 'version-1' }));
    mount(store);

    connectSocket();
    await vi.advanceTimersByTimeAsync(0);

    expect(flowsApiMock.get).not.toHaveBeenCalled();
    expect(store.getState().flowVersion.id).toBe('version-1');
  });

  it('does not refresh when the tab becomes hidden', async () => {
    const store = createStore(flowWithDraftVersion({ versionId: 'draft-1' }));
    mount(store);

    hideTab();
    await vi.advanceTimersByTimeAsync(0);

    expect(flowsApiMock.get).not.toHaveBeenCalled();
  });

  function mount(store: BuilderStore) {
    act(() => {
      root.render(
        <BuilderStateContext.Provider value={store}>
          <ReconnectAndReturnWatcher />
          <Toaster />
        </BuilderStateContext.Provider>,
      );
    });
  }
});

function shownToasts() {
  return document.querySelectorAll('[data-sonner-toast]');
}

function DraftPushWatcher() {
  flowCanvasHooks.useRefreshDraftOnPush();
  return null;
}

function DraftPushWatcherWithFlowLock() {
  useFlowLock();
  flowCanvasHooks.useRefreshDraftOnPush();
  return null;
}

function sendDraftPush(event: FlowDraftUpdatedEvent) {
  act(() => {
    socketHarness.sendFromServer({
      event: WebsocketClientEvent.FLOW_DRAFT_UPDATED,
      payload: event,
    });
  });
}

function ReconnectAndReturnWatcher() {
  flowCanvasHooks.useRefreshDraftOnReconnectAndReturn();
  return null;
}

function connectSocket() {
  act(() => {
    socketHarness.sendFromServer({ event: 'connect', payload: undefined });
  });
}

function LeaveWatcher() {
  flowCanvasHooks.useFlushPendingEditsOnLeave();
  return null;
}

function hideTab() {
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
  document.dispatchEvent(new Event('visibilitychange'));
}

function showTab() {
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
  document.dispatchEvent(new Event('visibilitychange'));
}

function renameTrigger(displayName: string): FlowOperationRequest {
  return {
    type: FlowOperationType.UPDATE_TRIGGER,
    request: {
      name: 'trigger',
      valid: false,
      displayName,
      type: FlowTriggerType.EMPTY,
      settings: {},
    },
  };
}

function sentOperations(): FlowOperationRequest[] {
  return flowsApiMock.update.mock.calls.map(([, operation]) => operation);
}

function createStore(flow: PopulatedFlow): BuilderStore {
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

function publishedFlowWithNoDraft(): PopulatedFlow {
  const flow = flowWithDraftVersion({ versionId: 'version-1' });
  return {
    ...flow,
    publishedVersionId: 'version-1',
    version: lockedVersion({ flow, versionId: 'version-1' }),
  };
}

function lockedVersion({
  flow,
  versionId,
}: {
  flow: PopulatedFlow;
  versionId: string;
}): FlowVersion {
  return { ...flow.version, id: versionId, state: FlowVersionState.LOCKED };
}

function testRun(): FlowRun {
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

function agentNotes(count: number): Note[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `note-${index + 1}`,
    content: `Agent save ${index + 1}`,
    ownerId: null,
    color: NoteColorVariant.YELLOW,
    position: { x: 0, y: index * 200 },
    size: { width: 200, height: 200 },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }));
}

function flowWithDraftVersion({
  versionId,
  displayName = 'Order lookup',
  notes = [],
}: {
  versionId: string;
  displayName?: string;
  notes?: Note[];
}): PopulatedFlow {
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
      id: versionId,
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
      notes,
    },
  };
}

type LockHolder = { userId: string; userDisplayName: string };
