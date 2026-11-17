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
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { io } from 'socket.io-client';
import { describe, expect, it, vi } from 'vitest';

import {
  BuilderStateContext,
  createBuilderStore,
} from '@/app/builder/builder-hooks';
import { flowCanvasHooks } from '@/app/builder/flow-canvas/hooks';

const flowRunsApiMock = vi.hoisted(() => ({
  getPopulated: vi.fn<(runId: string) => Promise<FlowRun>>(),
}));

vi.mock('@/features/flow-runs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/flow-runs')>();
  return {
    ...actual,
    flowRunsApi: { ...actual.flowRunsApi, ...flowRunsApiMock },
  };
});

describe('useListenToExistingRun', () => {
  it('refreshes a running production run on the run route without a query error', async () => {
    flowRunsApiMock.getPopulated.mockResolvedValue(
      flowRun({ status: FlowRunStatus.SUCCEEDED }),
    );
    const onQueryError = vi.fn();
    const queryClient = new QueryClient({
      queryCache: new QueryCache({ onError: onQueryError }),
      defaultOptions: { queries: { retry: false } },
    });
    const flow = publishedFlow();
    const store = createBuilderStore({
      flow,
      flowVersion: flow.version,
      readonly: true,
      hideTestWidget: false,
      run: flowRun({ status: FlowRunStatus.RUNNING }),
      outputSampleData: {},
      inputSampleData: {},
      socket: io({ autoConnect: false }),
      queryClient,
    });

    render(
      <MemoryRouter initialEntries={['/projects/project-1/runs/run-1']}>
        <QueryClientProvider client={queryClient}>
          <BuilderStateContext.Provider value={store}>
            <ListenToExistingRun />
          </BuilderStateContext.Provider>
        </QueryClientProvider>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(store.getState().run?.status).toBe(FlowRunStatus.SUCCEEDED),
    );
    expect(flowRunsApiMock.getPopulated).toHaveBeenCalledWith('run-1');
    await waitFor(() =>
      expect(
        queryClient.getQueryState(['refetched-run', 'run-1'])?.status,
      ).toBe('success'),
    );
    expect(onQueryError).not.toHaveBeenCalled();
  });
});

function ListenToExistingRun() {
  flowCanvasHooks.useListenToExistingRun();
  return null;
}

function flowRun({ status }: { status: FlowRunStatus }): FlowRun {
  return {
    id: 'run-1',
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    projectId: 'project-1',
    flowId: 'flow-1',
    flowVersionId: 'version-1',
    failParentOnFailure: false,
    logsFileId: null,
    status,
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
