/**
 * @vitest-environment jsdom
 * Regression: https://github.com/activepieces/activepieces/issues/13556
 */
/* eslint-disable testing-library/no-unnecessary-act */
import {
  FlowOperationStatus,
  FlowRun,
  FlowRunStatus,
  FlowStatus,
  FlowTriggerType,
  FlowVersionState,
  PopulatedFlow,
  RunEnvironment,
} from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { io } from 'socket.io-client';
import { afterEach, describe, expect, it, vi } from 'vitest';

const captured = vi.hoisted(() => ({
  viewingRun: undefined as boolean | undefined,
}));

vi.mock('@/app/components/flow-actions-menu', () => ({
  default: ({ viewingRun }: { viewingRun: boolean }) => {
    captured.viewingRun = viewingRun;
    return null;
  },
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/components/custom/active-users-widget', () => ({
  ActiveUsersWidget: () => null,
}));

vi.mock('@/components/custom/editable-text', () => ({
  default: () => null,
}));

vi.mock('@/components/custom/home-button', () => ({ HomeButton: () => null }));

vi.mock('@/components/providers/embed-provider', () => ({
  useEmbedding: () => ({
    embedState: {
      isEmbedded: false,
      hideFlowNameInBuilder: false,
      disableNavigationInBuilder: false,
      hideHomeButtonInBuilder: false,
      hidePageHeader: false,
      hideActiveUsers: false,
    },
  }),
}));

vi.mock('@/features/flows', () => ({
  flowHooks: { invalidateFlowsQuery: vi.fn() },
}));

vi.mock('@/features/flows/components/flow-created-by-badge', () => ({
  FlowCreatedByBadge: () => null,
}));

vi.mock('@/features/folders', () => ({
  foldersHooks: { useFolder: () => ({ data: null }) },
}));

vi.mock('@/features/projects', () => ({
  getProjectName: () => 'project',
  projectCollectionUtils: { useCurrentProject: () => ({ project: null }) },
}));

vi.mock('@/hooks/authorization-hooks', () => ({
  useAuthorization: () => ({ checkAccess: () => true }),
}));

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: false }) },
}));

vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: {
    getProjectId: () => 'project-1',
    appendProjectRoutePrefix: (route: string) => route,
  },
}));

vi.mock('@/lib/navigation-utils', () => ({ useNewWindow: () => vi.fn() }));

vi.mock('@/app/builder/builder-header/flow-status', () => ({
  BuilderFlowStatusSection: () => null,
}));

// eslint-disable-next-line import/first
import { BuilderHeader } from '@/app/builder/builder-header/builder-header';
import {
  BuilderStateContext,
  BuilderStore,
  createBuilderStore,
} from '@/app/builder/builder-hooks';
// eslint-disable-next-line import/first

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function buildFlow(): PopulatedFlow {
  const now = new Date().toISOString();
  return {
    id: 'flow-1',
    created: now,
    updated: now,
    projectId: 'project-1',
    externalId: 'flow-1',
    ownerId: null,
    folderId: null,
    status: FlowStatus.DISABLED,
    publishedVersionId: 'version-1',
    metadata: null,
    operationStatus: FlowOperationStatus.NONE,
    timeSavedPerRun: null,
    templateId: null,
    createdBy: null,
    version: {
      id: 'version-1',
      created: now,
      updated: now,
      flowId: 'flow-1',
      displayName: 'Test flow',
      updatedBy: null,
      valid: true,
      schemaVersion: null,
      agentIds: [],
      state: FlowVersionState.DRAFT,
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
      },
    },
  };
}

function buildRun(): FlowRun {
  const now = new Date().toISOString();
  return {
    id: 'run-1',
    created: now,
    updated: now,
    projectId: 'project-1',
    flowId: 'flow-1',
    flowVersionId: 'version-1',
    failParentOnFailure: false,
    logsFileId: null,
    status: FlowRunStatus.SUCCEEDED,
    environment: RunEnvironment.TESTING,
    steps: {},
    tags: [],
    archivedAt: null,
  };
}

const queryClient = new QueryClient();

function createStore(run: FlowRun | null): BuilderStore {
  const flow = buildFlow();
  return createBuilderStore({
    flow,
    flowVersion: flow.version,
    readonly: false,
    hideTestWidget: false,
    run,
    outputSampleData: {},
    inputSampleData: {},
    socket: io('http://localhost', { autoConnect: false }),
    queryClient,
  });
}

let container: HTMLDivElement | null = null;
let root: Root | null = null;

function renderHeader(run: FlowRun | null): void {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  const mountedRoot = root;
  act(() => {
    mountedRoot.render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/projects/project-1/runs/run-1']}>
          <BuilderStateContext.Provider value={createStore(run)}>
            <BuilderHeader />
          </BuilderStateContext.Provider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  });
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  root = null;
  container = null;
  captured.viewingRun = undefined;
});

describe('builder header versions entry', () => {
  it('reports no run being viewed while the route still points at a run', () => {
    renderHeader(null);

    expect(captured.viewingRun).toBe(false);
  });

  it('reports a run being viewed when builder state holds one', () => {
    renderHeader(buildRun());

    expect(captured.viewingRun).toBe(true);
  });
});
