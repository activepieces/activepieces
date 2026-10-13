// @vitest-environment jsdom
import {
  CodeAction,
  EmptyTrigger,
  FlowActionType,
  FlowOperationStatus,
  FlowRun,
  FlowRunStatus,
  FlowStatus,
  FlowTriggerType,
  FlowVersion,
  FlowVersionState,
  PopulatedFlow,
  RunEnvironment,
} from '@activepieces/shared';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { io } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  BuilderStateContext,
  BuilderStore,
  createBuilderStore,
} from '@/app/builder/builder-hooks';
import { useFlowLock } from '@/app/builder/flow-canvas/widgets/use-flow-lock';
import { RightSideBarType } from '@/app/builder/types';

const harness = vi.hoisted(() => {
  const captured: { onTakeOver?: () => void | Promise<void> } = {};
  return {
    navigate: vi.fn(),
    switchToDraft: vi.fn(),
    getFlow: vi.fn(),
    canEditFlow: true,
    captured,
  };
});

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/features/flows/api/flows-api', () => ({
  flowsApi: { get: harness.getFlow, update: vi.fn() },
}));

vi.mock('@/hooks/use-resource-lock', () => ({
  useResourceLock: ({
    onTakeOver,
  }: {
    onTakeOver?: () => void | Promise<void>;
  }) => {
    harness.captured.onTakeOver = onTakeOver;
    return { lockedBy: null, takeOver: vi.fn() };
  },
}));

vi.mock('@/hooks/authorization-hooks', () => ({
  useAuthorization: () => ({ checkAccess: () => harness.canEditFlow }),
}));

vi.mock('@/app/builder/flow-canvas/hooks', () => ({
  flowCanvasHooks: {
    useSwitchToDraft: () => ({ switchToDraft: harness.switchToDraft }),
  },
}));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => harness.navigate,
}));

describe('useFlowLock take-over', () => {
  const reloadSpy = vi.fn();
  const originalLocation = Object.getOwnPropertyDescriptor(window, 'location');

  beforeEach(() => {
    harness.navigate.mockReset();
    harness.switchToDraft.mockReset();
    harness.getFlow.mockReset();
    harness.captured.onTakeOver = undefined;
    harness.canEditFlow = true;
    reloadSpy.mockReset();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload: reloadSpy },
    });
  });

  afterEach(() => {
    if (originalLocation) {
      Object.defineProperty(window, 'location', originalLocation);
    }
  });

  it('navigates to the flow client-side when a run is being viewed', async () => {
    const flow = draftFlow({ customerEmail: '{{trigger.email}}' });
    renderFlowLock(createStore({ flow, run: flowRun() }));

    await takeOver();

    expect(harness.navigate).toHaveBeenCalledTimes(1);
    expect(harness.navigate).toHaveBeenCalledWith(`/flows/${flow.id}`);
    expect(harness.switchToDraft).not.toHaveBeenCalled();
    expect(harness.getFlow).not.toHaveBeenCalled();
    expect(reloadSpy).not.toHaveBeenCalled();
  });

  it('keeps the open step panel and shows the newest draft', async () => {
    const store = createStore({
      flow: draftFlow({ customerEmail: '{{trigger.email}}' }),
    });
    store.getState().selectStepByName('step_1');
    harness.getFlow.mockResolvedValue(
      draftFlow({
        customerEmail: '{{trigger.email}}',
        orderId: '{{trigger.order}}',
      }),
    );
    renderFlowLock(store);

    await takeOver();

    expect(store.getState()).toMatchObject({
      selectedStep: 'step_1',
      rightSidebar: RightSideBarType.PIECE_SETTINGS,
      flowVersion: {
        trigger: {
          nextAction: {
            settings: {
              input: {
                customerEmail: '{{trigger.email}}',
                orderId: '{{trigger.order}}',
              },
            },
          },
        },
      },
    });
    expect(reloadSpy).not.toHaveBeenCalled();
  });

  it('makes a read-only tab on the published version editable and shows the new draft', async () => {
    const store = createStore({
      flow: publishedFlow(draftFlow({ customerEmail: '{{trigger.email}}' })),
    });
    store.getState().selectStepByName('step_1');
    harness.getFlow.mockResolvedValue(
      draftFlow({ customerEmail: '{{trigger.customerEmail}}' }),
    );
    renderFlowLock(store);

    await takeOver();

    expect(store.getState()).toMatchObject({
      readonly: false,
      selectedStep: 'step_1',
      flowVersion: { state: FlowVersionState.DRAFT },
    });
  });

  it('keeps the tab read-only for a person who cannot edit the flow', async () => {
    harness.canEditFlow = false;
    const store = createStore({
      flow: publishedFlow(draftFlow({ customerEmail: '{{trigger.email}}' })),
    });
    harness.getFlow.mockResolvedValue(
      draftFlow({ customerEmail: '{{trigger.customerEmail}}' }),
    );
    renderFlowLock(store);

    await takeOver();

    expect(store.getState().readonly).toBe(true);
  });

  it('switches to the draft when an older version is being viewed', async () => {
    const flow = draftFlow({ customerEmail: '{{trigger.email}}' });
    renderFlowLock(
      createStore({ flow, flowVersion: olderVersion(flow.version) }),
    );

    await takeOver();

    expect(harness.switchToDraft).toHaveBeenCalledTimes(1);
    expect(harness.getFlow).not.toHaveBeenCalled();
    expect(harness.navigate).not.toHaveBeenCalled();
    expect(reloadSpy).not.toHaveBeenCalled();
  });
});

function renderFlowLock(store: BuilderStore) {
  renderHook(() => useFlowLock(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <BuilderStateContext.Provider value={store}>
        {children}
      </BuilderStateContext.Provider>
    ),
  });
}

async function takeOver() {
  await act(async () => {
    await harness.captured.onTakeOver?.();
  });
}

function createStore({
  flow,
  flowVersion = flow.version,
  run = null,
}: {
  flow: PopulatedFlow;
  flowVersion?: FlowVersion;
  run?: FlowRun | null;
}): BuilderStore {
  return createBuilderStore({
    flow,
    flowVersion,
    readonly: true,
    hideTestWidget: false,
    run,
    outputSampleData: {},
    inputSampleData: {},
    socket: io({ autoConnect: false }),
    queryClient: new QueryClient(),
  });
}

function publishedFlow(flow: PopulatedFlow): PopulatedFlow {
  return {
    ...flow,
    publishedVersionId: 'version-1',
    version: olderVersion(flow.version),
  };
}

function olderVersion(draft: FlowVersion): FlowVersion {
  return { ...draft, id: 'version-1', state: FlowVersionState.LOCKED };
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

function draftFlow(lookUpOrderInput: Record<string, string>): PopulatedFlow {
  const lookUpOrder: CodeAction = {
    name: 'step_1',
    valid: true,
    displayName: 'Look up order',
    lastUpdatedDate: '2026-01-01T00:00:00.000Z',
    type: FlowActionType.CODE,
    settings: {
      sourceCode: {
        code: 'export const code = async (inputs) => inputs;',
        packageJson: '{}',
      },
      input: lookUpOrderInput,
      errorHandlingOptions: {},
    },
  };
  const trigger: EmptyTrigger = {
    name: 'trigger',
    valid: false,
    displayName: 'Select Trigger',
    type: FlowTriggerType.EMPTY,
    settings: {},
    lastUpdatedDate: '2026-01-01T00:00:00.000Z',
    nextAction: lookUpOrder,
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
