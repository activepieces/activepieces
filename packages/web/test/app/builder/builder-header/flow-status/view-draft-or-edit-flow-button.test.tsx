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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { io } from 'socket.io-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => ({
  getFlow: vi.fn(),
  canEditFlow: true,
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/features/flows/api/flows-api', () => ({
  flowsApi: { get: harness.getFlow, update: vi.fn() },
}));

vi.mock('@/hooks/authorization-hooks', () => ({
  useAuthorization: () => ({ checkAccess: () => harness.canEditFlow }),
}));

vi.mock('@/app/builder/step-settings/code-settings/code-editor', () => ({
  CodeEditor: () => null,
}));

vi.mock('@/features/projects', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/projects')>()),
  projectCollectionUtils: {
    useCurrentProject: () => ({ project: { id: 'project-1' } }),
  },
}));

import {
  BuilderStateContext,
  BuilderStore,
  createBuilderStore,
} from '@/app/builder/builder-hooks';
import { EditFlowOrViewDraftButton } from '@/app/builder/builder-header/flow-status/view-draft-or-edit-flow-button';
import { StepSettingsPanel } from '@/app/builder/step-settings/step-settings-panel';
import { RightSideBarType } from '@/app/builder/types';

globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('EditFlowOrViewDraftButton', () => {
  beforeEach(() => {
    harness.getFlow.mockReset();
    harness.canEditFlow = true;
  });

  it('keeps the open step on the published version and makes its mention field editable', async () => {
    const flow = publishedFlowWithNoDraft();
    const store = createStore({ flow });
    store.getState().selectStepByName('step_1');
    harness.getFlow.mockResolvedValue(flow);
    const { container } = renderBuilder(store);
    expect(mentionFieldEditableStates(container)).toEqual(['false']);

    fireEvent.click(screen.getByRole('button', { name: 'Edit flow' }));

    await waitFor(() => {
      expect(store.getState().readonly).toBe(false);
    });
    expect(store.getState()).toMatchObject({
      selectedStep: 'step_1',
      rightSidebar: RightSideBarType.PIECE_SETTINGS,
    });
    expect(mentionFieldEditableStates(container)).toEqual(['true']);
  });

  it('keeps the tab read-only when the person opens an older version while the request runs', async () => {
    const flow = publishedFlowWithNoDraft();
    const store = createStore({ flow });
    const response = Promise.withResolvers<PopulatedFlow>();
    harness.getFlow.mockReturnValue(response.promise);
    renderBuilder(store);
    const button = screen.getByRole('button', { name: 'Edit flow' });

    fireEvent.click(button);
    await waitFor(() => {
      expect(harness.getFlow).toHaveBeenCalledTimes(1);
    });
    act(() => {
      store.getState().setVersion(olderVersion());
    });
    await act(async () => {
      response.resolve(flow);
    });
    await waitFor(() => {
      expect(button.hasAttribute('disabled')).toBe(false);
    });

    expect(store.getState()).toMatchObject({
      readonly: true,
      flowVersion: { id: 'version-0' },
    });
  });

  it('keeps the tab read-only for a person who cannot edit the flow', async () => {
    harness.canEditFlow = false;
    const flow = publishedFlowWithNoDraft();
    const store = createStore({ flow });
    store.getState().selectStepByName('step_1');
    harness.getFlow.mockResolvedValue(flow);
    const { container } = renderBuilder(store);
    const button = screen.getByRole('button', { name: 'View draft' });

    fireEvent.click(button);
    await waitFor(() => {
      expect(harness.getFlow).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(button.hasAttribute('disabled')).toBe(false);
    });

    expect(store.getState()).toMatchObject({
      readonly: true,
      selectedStep: 'step_1',
    });
    expect(mentionFieldEditableStates(container)).toEqual(['false']);
  });

  it('opens the flow from a run when the browser address is not the run page', async () => {
    const store = createStore({
      flow: publishedFlowWithNoDraft(),
      run: flowRun(),
    });
    render(
      <MemoryRouter initialEntries={['/runs/run-1']}>
        <QueryClientProvider client={new QueryClient()}>
          <BuilderStateContext.Provider value={store}>
            <Routes>
              <Route
                path="/runs/:runId"
                element={<EditFlowOrViewDraftButton onCanvas={false} />}
              />
              <Route path="/flows/:flowId" element={<p>Flow builder</p>} />
            </Routes>
          </BuilderStateContext.Provider>
        </QueryClientProvider>
      </MemoryRouter>,
    );
    expect(window.location.pathname).not.toContain('/runs');

    fireEvent.click(screen.getByRole('button', { name: 'Edit flow' }));

    expect(await screen.findByText('Flow builder')).toBeTruthy();
    expect(harness.getFlow).not.toHaveBeenCalled();
  });
});

function renderBuilder(store: BuilderStore) {
  return render(
    <MemoryRouter>
      <QueryClientProvider client={new QueryClient()}>
        <BuilderStateContext.Provider value={store}>
          <EditFlowOrViewDraftButton onCanvas={false} />
          <StepSettingsPanel
            pieceModel={undefined}
            pieceModelNotFound={false}
          />
        </BuilderStateContext.Provider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

function mentionFieldEditableStates(container: HTMLElement) {
  return Array.from(container.querySelectorAll('.ProseMirror')).map((element) =>
    element.getAttribute('contenteditable'),
  );
}

function createStore({
  flow,
  run = null,
}: {
  flow: PopulatedFlow;
  run?: FlowRun | null;
}): BuilderStore {
  return createBuilderStore({
    flow,
    flowVersion: flow.version,
    readonly: true,
    hideTestWidget: false,
    run,
    outputSampleData: {},
    inputSampleData: {},
    socket: io({ autoConnect: false }),
    queryClient: new QueryClient(),
  });
}

function publishedFlowWithNoDraft(): PopulatedFlow {
  const version = publishedVersion();
  return {
    id: 'flow-1',
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    projectId: 'project-1',
    externalId: 'flow-1',
    ownerId: null,
    folderId: null,
    status: FlowStatus.ENABLED,
    publishedVersionId: version.id,
    metadata: null,
    operationStatus: FlowOperationStatus.NONE,
    timeSavedPerRun: null,
    templateId: null,
    createdBy: null,
    version,
  };
}

function olderVersion(): FlowVersion {
  return { ...publishedVersion(), id: 'version-0' };
}

function flowRun(): FlowRun {
  return {
    id: 'run-1',
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    projectId: 'project-1',
    flowId: 'flow-1',
    flowVersionId: 'version-1',
    failParentOnFailure: false,
    logsFileId: null,
    status: FlowRunStatus.FAILED,
    environment: RunEnvironment.PRODUCTION,
    steps: {},
    tags: [],
    archivedAt: null,
  };
}

function publishedVersion(): FlowVersion {
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
      input: { customerEmail: '{{trigger.email}}' },
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
    id: 'version-1',
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    flowId: 'flow-1',
    displayName: 'Order lookup',
    trigger,
    updatedBy: null,
    valid: false,
    schemaVersion: null,
    agentIds: [],
    state: FlowVersionState.LOCKED,
    connectionIds: [],
    backupFiles: null,
    notes: [],
  };
}
