/**
 * @vitest-environment jsdom
 */
/* eslint-disable testing-library/no-unnecessary-act */
import {
  FlowAction,
  FlowOperationStatus,
  FlowStatus,
  FlowTriggerType,
  FlowVersion,
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
import { flowCanvasHooks } from '@/app/builder/flow-canvas/hooks';
import { RightSideBarType } from '@/app/builder/types';
import { flowsApi } from '@/features/flows';

vi.mock('@/hooks/authorization-hooks', () => ({
  useAuthorization: () => ({ checkAccess: () => true }),
}));

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const PUBLISHED_VERSION_ID = 'version-published';
const DRAFT_VERSION_ID = 'version-draft';

function buildAction({
  name,
  nextAction,
}: {
  name: string;
  nextAction?: FlowAction;
}): FlowAction {
  return {
    name,
    valid: true,
    displayName: name,
    type: 'CODE',
    settings: {},
    skip: false,
    nextAction,
  };
}

function buildVersion({
  id,
  state,
  stepNames,
}: {
  id: string;
  state: FlowVersionState;
  stepNames: string[];
}): FlowVersion {
  const now = new Date().toISOString();
  const firstAction = stepNames.reduceRight<FlowAction | undefined>(
    (nextAction, name) => buildAction({ name, nextAction }),
    undefined,
  );
  return {
    id,
    created: now,
    updated: now,
    flowId: 'flow-1',
    displayName: 'Test flow',
    updatedBy: null,
    valid: true,
    schemaVersion: null,
    agentIds: [],
    state,
    connectionIds: [],
    backupFiles: null,
    notes: [],
    trigger: {
      name: 'trigger',
      valid: true,
      displayName: 'Trigger',
      type: FlowTriggerType.EMPTY,
      settings: {},
      lastUpdatedDate: now,
      nextAction: firstAction,
    },
  };
}

function buildFlow(version: FlowVersion): PopulatedFlow {
  const now = new Date().toISOString();
  return {
    id: 'flow-1',
    created: now,
    updated: now,
    projectId: 'project-1',
    externalId: 'flow-1',
    ownerId: null,
    folderId: null,
    status: FlowStatus.ENABLED,
    publishedVersionId: PUBLISHED_VERSION_ID,
    metadata: null,
    operationStatus: FlowOperationStatus.NONE,
    timeSavedPerRun: null,
    templateId: null,
    createdBy: null,
    version,
  };
}

function createStore({
  version,
  selectedStep,
}: {
  version: FlowVersion;
  selectedStep: string;
}): BuilderStore {
  const store = createBuilderStore({
    flow: buildFlow(version),
    flowVersion: version,
    readonly: true,
    hideTestWidget: false,
    run: null,
    outputSampleData: {},
    inputSampleData: {},
    socket: io('http://localhost', { autoConnect: false }),
    queryClient: new QueryClient(),
  });
  store.getState().selectStepByName(selectedStep);
  return store;
}

function Probe({ handle }: { handle: SwitchToDraftHandle }) {
  handle.current = flowCanvasHooks.useSwitchToDraft().switchToDraft;
  return null;
}

let container: HTMLDivElement | null = null;
let root: Root | null = null;

async function mountProbe({ store }: { store: BuilderStore }) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  const handle: SwitchToDraftHandle = { current: null };
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  const mountedRoot = root;
  await act(async () => {
    mountedRoot.render(
      <QueryClientProvider client={queryClient}>
        <BuilderStateContext.Provider value={store}>
          <Probe handle={handle} />
        </BuilderStateContext.Provider>
      </QueryClientProvider>,
    );
  });
  return handle;
}

async function switchToDraftAndWait({
  handle,
  store,
  fetchedFlow,
  keepSelectedStep,
}: {
  handle: SwitchToDraftHandle;
  store: BuilderStore;
  fetchedFlow: PopulatedFlow;
  keepSelectedStep: boolean;
}) {
  vi.spyOn(flowsApi, 'get').mockResolvedValue(fetchedFlow);
  await act(async () => {
    handle.current?.({ keepSelectedStep });
    await vi.waitFor(() => expect(store.getState().flow).toBe(fetchedFlow));
  });
}

describe('useSwitchToDraft', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(async () => {
    const mountedRoot = root;
    if (mountedRoot) {
      await act(async () => {
        mountedRoot.unmount();
      });
    }
    container?.remove();
    root = null;
    container = null;
  });

  it('keeps the selected step when the draft has it', async () => {
    const store = createStore({
      version: buildVersion({
        id: PUBLISHED_VERSION_ID,
        state: FlowVersionState.LOCKED,
        stepNames: ['step_1', 'step_2'],
      }),
      selectedStep: 'step_2',
    });
    const handle = await mountProbe({ store });
    const fetchedFlow = buildFlow(
      buildVersion({
        id: DRAFT_VERSION_ID,
        state: FlowVersionState.DRAFT,
        stepNames: ['step_1', 'step_2'],
      }),
    );

    await switchToDraftAndWait({
      handle,
      store,
      fetchedFlow,
      keepSelectedStep: true,
    });

    expect(store.getState().flowVersion.id).toBe(DRAFT_VERSION_ID);
    expect(store.getState().selectedStep).toBe('step_2');
    expect(store.getState().rightSidebar).toBe(RightSideBarType.PIECE_SETTINGS);
  });

  it('selects the initial step when the draft does not have the selected step', async () => {
    const store = createStore({
      version: buildVersion({
        id: PUBLISHED_VERSION_ID,
        state: FlowVersionState.LOCKED,
        stepNames: ['step_1', 'step_2'],
      }),
      selectedStep: 'step_2',
    });
    const handle = await mountProbe({ store });
    const fetchedFlow = buildFlow(
      buildVersion({
        id: DRAFT_VERSION_ID,
        state: FlowVersionState.DRAFT,
        stepNames: ['step_1'],
      }),
    );

    await switchToDraftAndWait({
      handle,
      store,
      fetchedFlow,
      keepSelectedStep: true,
    });

    expect(store.getState().selectedStep).toBe('trigger');
  });

  it('keeps the selected step when no draft exists yet and the fetched version is the same', async () => {
    const store = createStore({
      version: buildVersion({
        id: PUBLISHED_VERSION_ID,
        state: FlowVersionState.LOCKED,
        stepNames: ['step_1', 'step_2'],
      }),
      selectedStep: 'step_2',
    });
    const handle = await mountProbe({ store });
    const fetchedFlow = buildFlow(
      buildVersion({
        id: PUBLISHED_VERSION_ID,
        state: FlowVersionState.LOCKED,
        stepNames: ['step_1', 'step_2'],
      }),
    );

    await switchToDraftAndWait({
      handle,
      store,
      fetchedFlow,
      keepSelectedStep: true,
    });

    expect(store.getState().selectedStep).toBe('step_2');
  });

  it('keeps the step selected after the last render, not an older one', async () => {
    const store = createStore({
      version: buildVersion({
        id: PUBLISHED_VERSION_ID,
        state: FlowVersionState.LOCKED,
        stepNames: ['step_1', 'step_2'],
      }),
      selectedStep: 'step_1',
    });
    const handle = await mountProbe({ store });
    await act(async () => {
      store.getState().selectStepByName('step_2');
    });
    const fetchedFlow = buildFlow(
      buildVersion({
        id: DRAFT_VERSION_ID,
        state: FlowVersionState.DRAFT,
        stepNames: ['step_1', 'step_2'],
      }),
    );

    await switchToDraftAndWait({
      handle,
      store,
      fetchedFlow,
      keepSelectedStep: true,
    });

    expect(store.getState().selectedStep).toBe('step_2');
  });

  it('resets the selection on a lock take-over so the step settings reload', async () => {
    const store = createStore({
      version: buildVersion({
        id: DRAFT_VERSION_ID,
        state: FlowVersionState.DRAFT,
        stepNames: ['step_1', 'step_2'],
      }),
      selectedStep: 'step_2',
    });
    const handle = await mountProbe({ store });
    const fetchedFlow = buildFlow(
      buildVersion({
        id: DRAFT_VERSION_ID,
        state: FlowVersionState.DRAFT,
        stepNames: ['step_1', 'step_2'],
      }),
    );

    await switchToDraftAndWait({
      handle,
      store,
      fetchedFlow,
      keepSelectedStep: false,
    });

    expect(store.getState().selectedStep).toBe('trigger');
  });
});

type SwitchToDraftHandle = {
  current:
    | ReturnType<typeof flowCanvasHooks.useSwitchToDraft>['switchToDraft']
    | null;
};
