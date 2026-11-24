// @vitest-environment jsdom
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
import { QueryClient } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EditFlowOrViewDraftButton } from '@/app/builder/builder-header/flow-status/view-draft-or-edit-flow-button';
import {
  BuilderStateContext,
  createBuilderStore,
} from '@/app/builder/builder-hooks';

const harness = vi.hoisted(() => ({
  switchToDraft: vi.fn(),
  pathname: '',
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/hooks/authorization-hooks', () => ({
  useAuthorization: () => ({ checkAccess: () => true }),
}));

vi.mock('@/app/builder/flow-canvas/hooks', () => ({
  flowCanvasHooks: {
    useSwitchToDraft: () => ({
      switchToDraft: harness.switchToDraft,
      isSwitchingToDraftPending: false,
    }),
  },
}));

describe('EditFlowOrViewDraftButton', () => {
  beforeEach(() => {
    harness.switchToDraft.mockReset();
  });

  it('leaves the run route through the app router, whatever window.location says', () => {
    renderButton({ route: '/projects/project-1/runs/run-1' });

    fireEvent.click(screen.getByRole('button', { name: 'Edit flow' }));

    expect(harness.pathname).toBe('/flows/flow-1');
    expect(harness.switchToDraft).not.toHaveBeenCalled();
  });

  it('switches to the draft in place after a test run in the builder', () => {
    renderButton({ route: '/projects/project-1/flows/flow-1' });

    fireEvent.click(screen.getByRole('button', { name: 'Edit flow' }));

    expect(harness.pathname).toBe('/projects/project-1/flows/flow-1');
    expect(harness.switchToDraft).toHaveBeenCalledTimes(1);
  });
});

function renderButton({ route }: { route: string }) {
  const flow = publishedFlow();
  const store = createBuilderStore({
    flow,
    flowVersion: flow.version,
    readonly: true,
    hideTestWidget: false,
    run: flowRun(),
    outputSampleData: {},
    inputSampleData: {},
    socket: io({ autoConnect: false }),
    queryClient: new QueryClient(),
  });
  render(
    <MemoryRouter initialEntries={[route]}>
      <BuilderStateContext.Provider value={store}>
        <Routes>
          <Route
            path="*"
            element={
              <>
                <EditFlowOrViewDraftButton onCanvas={false} />
                <Pathname />
              </>
            }
          />
        </Routes>
      </BuilderStateContext.Provider>
    </MemoryRouter>,
  );
}

function Pathname() {
  harness.pathname = useLocation().pathname;
  return null;
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
    status: FlowRunStatus.SUCCEEDED,
    environment: RunEnvironment.PRODUCTION,
    steps: {},
    tags: [],
    archivedAt: null,
  };
}

function publishedFlow(): PopulatedFlow {
  return {
    id: 'flow-1',
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    projectId: 'project-1',
    externalId: 'flow-1',
    ownerId: null,
    folderId: null,
    status: FlowStatus.ENABLED,
    publishedVersionId: 'version-1',
    metadata: null,
    operationStatus: FlowOperationStatus.NONE,
    timeSavedPerRun: null,
    templateId: null,
    createdBy: null,
    version: {
      id: 'version-1',
      created: '2026-01-01T00:00:00.000Z',
      updated: '2026-01-01T00:00:00.000Z',
      flowId: 'flow-1',
      displayName: 'Order lookup',
      trigger: {
        name: 'trigger',
        valid: true,
        displayName: 'Catch Webhook',
        type: FlowTriggerType.EMPTY,
        settings: {},
        lastUpdatedDate: '2026-01-01T00:00:00.000Z',
      },
      updatedBy: null,
      valid: true,
      schemaVersion: null,
      agentIds: [],
      state: FlowVersionState.LOCKED,
      connectionIds: [],
      backupFiles: null,
      notes: [],
    },
  };
}
