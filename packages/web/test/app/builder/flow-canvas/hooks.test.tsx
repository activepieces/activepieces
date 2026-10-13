// @vitest-environment jsdom
import {
  EmptyTrigger,
  FlowOperationRequest,
  FlowOperationStatus,
  FlowOperationType,
  FlowStatus,
  FlowTriggerType,
  FlowVersionState,
  PopulatedFlow,
} from '@activepieces/shared';
import { QueryClient } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { io } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  BuilderStateContext,
  BuilderStore,
  createBuilderStore,
} from '@/app/builder/builder-hooks';
import { flowCanvasHooks } from '@/app/builder/flow-canvas/hooks';

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

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/features/flows/api/flows-api', () => ({
  flowsApi: flowsApiMock,
}));

describe('useFlushPendingEditsOnLeave', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    flowsApiMock.update.mockReset();
    flowsApiMock.update.mockResolvedValue(flowWithDraftVersion('draft-1'));
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
    const store = createStore(flowWithDraftVersion('draft-1'));
    mount(store);

    store.getState().applyOperation(renameTrigger('New order'));
    hideTab();
    await vi.advanceTimersByTimeAsync(0);

    expect(sentOperations()).toEqual([renameTrigger('New order')]);
  });

  it('sends a pending edit when the builder unmounts, and the save completes after it', async () => {
    const save = Promise.withResolvers<PopulatedFlow>();
    flowsApiMock.update.mockReturnValue(save.promise);
    const store = createStore(flowWithDraftVersion('draft-1'));
    mount(store);

    store.getState().applyOperation(renameTrigger('New order'));
    act(() => root.unmount());
    await vi.advanceTimersByTimeAsync(0);
    expect(sentOperations()).toEqual([renameTrigger('New order')]);

    save.resolve(flowWithDraftVersion('draft-2'));
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

function LeaveWatcher() {
  flowCanvasHooks.useFlushPendingEditsOnLeave();
  return null;
}

function hideTab() {
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
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

function flowWithDraftVersion(versionId: string): PopulatedFlow {
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
      displayName: 'Order lookup',
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
