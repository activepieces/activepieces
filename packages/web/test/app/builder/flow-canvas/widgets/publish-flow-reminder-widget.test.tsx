// @vitest-environment jsdom
import {
  FlowOperationRequest,
  FlowOperationStatus,
  FlowOperationType,
  FlowStatus,
  FlowTriggerType,
  FlowVersionState,
  PopulatedFlow,
} from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { io } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  BuilderStateContext,
  BuilderStore,
  createBuilderStore,
} from '@/app/builder/builder-hooks';
import { PublishFlowReminderWidget } from '@/app/builder/flow-canvas/widgets/publish-flow-reminder-widget';

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

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: { plan: { environmentsEnabled: false } },
    }),
  },
}));

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: true }) },
}));

vi.mock('@/hooks/authorization-hooks', () => ({
  useAuthorization: () => ({ checkAccess: () => true }),
}));

vi.mock('@/features/projects', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/projects')>()),
  projectCollectionUtils: {
    useCurrentProject: () => ({ project: { sensitive: false } }),
  },
}));

vi.mock('@/app/builder/flow-canvas/widgets/required-actions-dialog', () => ({
  useRequiredActionsCheck: () => ({
    checkRequiredActions: async () => null,
    explainServerRejection: async () => null,
  }),
  RequiredActionsDialog: () => null,
}));

describe('PublishFlowReminderWidget', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    flowsApiMock.update.mockReset();
    flowsApiMock.update.mockResolvedValue(validDraftFlow());
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  it('shows Publish only after an edit in the debounce is saved, and publishes it', async () => {
    const store = createStore(validDraftFlow());
    store.getState().applyOperation(changeName('Orders'));
    store.getState().applyOperation(renameTrigger('New order'));
    await act(async () => root.render(<Widget store={store} />));
    await settle();
    expect(findPublishButton()).toBeNull();

    await act(() => vi.advanceTimersByTimeAsync(1000));
    await act(async () => publishButton().click());
    await settle();

    expect(sentOperationTypes()).toEqual([
      FlowOperationType.CHANGE_NAME,
      FlowOperationType.UPDATE_TRIGGER,
      FlowOperationType.LOCK_AND_PUBLISH,
    ]);
  });

  it('publishes only after the pending edits are saved', async () => {
    const pendingEdits = Promise.withResolvers<void>();
    const store = createStore(validDraftFlow());
    store.setState({ savePendingEdits: () => pendingEdits.promise });
    await act(async () => root.render(<Widget store={store} />));

    await act(async () => publishButton().click());
    await settle();
    expect(sentOperationTypes()).toEqual([]);

    pendingEdits.resolve();
    await settle();
    expect(sentOperationTypes()).toEqual([FlowOperationType.LOCK_AND_PUBLISH]);
  });

  it('does not publish when a pending edit fails to save', async () => {
    const store = createStore(validDraftFlow());
    store.setState({
      savePendingEdits: () =>
        Promise.reject(new Error('Request failed with status code 400')),
    });
    await act(async () => root.render(<Widget store={store} />));

    await act(async () => publishButton().click());
    await settle();

    expect(sentOperationTypes()).toEqual([]);
    expect(store.getState().isPublishing).toBe(false);
  });
});

function Widget({ store }: { store: BuilderStore }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <BuilderStateContext.Provider value={store}>
        <PublishFlowReminderWidget />
      </BuilderStateContext.Provider>
    </QueryClientProvider>
  );
}

function publishButton(): HTMLButtonElement {
  const button = findPublishButton();
  if (!button) {
    throw new Error('The Publish button is not on the page');
  }
  return button;
}

function findPublishButton(): HTMLButtonElement | null {
  return document.querySelector<HTMLButtonElement>('button[name="Publish"]');
}

async function settle() {
  await act(() => vi.advanceTimersByTimeAsync(100));
}

function sentOperationTypes(): FlowOperationType[] {
  return flowsApiMock.update.mock.calls.map(([, operation]) => operation.type);
}

function changeName(displayName: string): FlowOperationRequest {
  return {
    type: FlowOperationType.CHANGE_NAME,
    request: { displayName },
  };
}

function renameTrigger(displayName: string): FlowOperationRequest {
  return {
    type: FlowOperationType.UPDATE_TRIGGER,
    request: {
      name: 'trigger',
      valid: true,
      displayName,
      type: FlowTriggerType.EMPTY,
      settings: {},
    },
  };
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

function validDraftFlow(): PopulatedFlow {
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
      displayName: 'Order lookup',
      trigger: {
        name: 'trigger',
        valid: true,
        displayName: 'Select Trigger',
        type: FlowTriggerType.EMPTY,
        settings: {},
        lastUpdatedDate: '2026-01-01T00:00:00.000Z',
      },
      updatedBy: null,
      valid: true,
      schemaVersion: null,
      agentIds: [],
      state: FlowVersionState.DRAFT,
      connectionIds: [],
      backupFiles: null,
      notes: [],
    },
  };
}
