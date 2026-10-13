// @vitest-environment jsdom
import {
  EmptyTrigger,
  FlowOperationRequest,
  FlowDraftUpdatedEvent,
  FlowOperationStatus,
  FlowOperationType,
  FlowStatus,
  FlowTriggerType,
  FlowVersionState,
  Note,
  NoteColorVariant,
  PopulatedFlow,
  WebsocketClientEvent,
} from '@activepieces/shared';
import { QueryClient } from '@tanstack/react-query';
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

vi.mock('i18next', () => ({ t: (key: string) => key }));

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
    flowsApiMock.update.mockReset();
    flowsApiMock.get.mockReset();
    vi.spyOn(toast, 'info');
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

  it('shows the newest draft after a push from a different Editor Session', async () => {
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
    expect(toast.info).toHaveBeenCalledWith(
      'This flow was changed in a different tab or by a different editor. You see the newest version.',
      expect.anything(),
    );
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
    expect(toast.info).not.toHaveBeenCalled();
  });

  it('ignores a push for a different flow', async () => {
    const store = createStore(flowWithDraftVersion({ versionId: 'draft-1' }));
    mount(store);

    sendDraftPush({ flowId: 'flow-2', editorSessionId: 'other-session' });
    await vi.advanceTimersByTimeAsync(0);

    expect(flowsApiMock.get).not.toHaveBeenCalled();
    expect(toast.info).not.toHaveBeenCalled();
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

  it('shows one toast for a burst of pushes', async () => {
    const store = createStore(flowWithDraftVersion({ versionId: 'draft-1' }));
    flowsApiMock.get.mockResolvedValue(
      flowWithDraftVersion({
        versionId: 'draft-1',
        displayName: 'Renamed by an agent',
      }),
    );
    mount(store);

    for (let push = 0; push < 3; push++) {
      sendDraftPush({ flowId: 'flow-1', editorSessionId: null });
      await vi.advanceTimersByTimeAsync(100);
    }

    expect(shownToasts()).toHaveLength(1);
  });

  it('sends two GETs for a chat that saves six times in 12 s, and shows each save in one toast', async () => {
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
    expect(shownToasts()).toHaveLength(1);
  });

  it('shows the error toast and not the refresh toast when the fetch fails', async () => {
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
    expect(toast.info).not.toHaveBeenCalled();
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

  it('does not refresh on the first connect of a page load', async () => {
    const store = createStore(flowWithDraftVersion({ versionId: 'draft-1' }));
    mount(store);

    connectSocket();
    await vi.advanceTimersByTimeAsync(0);

    expect(flowsApiMock.get).not.toHaveBeenCalled();
  });

  it('refreshes on a reconnect that follows the first connect of a page load', async () => {
    const store = createStore(flowWithDraftVersion({ versionId: 'draft-1' }));
    mount(store);

    connectSocket();
    await vi.advanceTimersByTimeAsync(0);
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
