/**
 * @vitest-environment jsdom
 */
/* eslint-disable testing-library/no-unnecessary-act */
import {
  FlowActionType,
  FlowOperationStatus,
  FlowRun,
  FlowRunStatus,
  FlowStatus,
  FlowTriggerType,
  FlowVersionState,
  GenericStepOutput,
  PopulatedFlow,
  RunEnvironment,
  StepOutputStatus,
} from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { io } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  BuilderStateContext,
  createBuilderStore,
} from '@/app/builder/builder-hooks';
import {
  BatchLogs,
  useBatchLogs,
} from '@/app/builder/run-details/use-batch-logs';

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const harness = vi.hoisted(() => ({
  list: vi.fn(),
  getPopulated: vi.fn(),
}));

vi.mock('@/features/flow-runs/api/flow-runs-api', () => ({
  flowRunsApi: {
    list: harness.list,
    getPopulated: harness.getPopulated,
  },
}));

const NOW = '2026-01-01T00:00:00.000Z';

const finishedSummary = {
  barrierId: 'barrier-1',
  totalItems: 20,
  batchSize: 10,
  total: 2,
  succeeded: 2,
  failed: 0,
  rejected: 0,
  canceled: 0,
  notDispatched: 0,
  stillRunning: 0,
  timedOut: false,
};

const observed: BatchLogs[] = [];

function buildFlow(): PopulatedFlow {
  return {
    id: 'flow-1',
    created: NOW,
    updated: NOW,
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
      id: 'version-1',
      created: NOW,
      updated: NOW,
      flowId: 'flow-1',
      displayName: 'Test flow',
      updatedBy: null,
      valid: true,
      schemaVersion: null,
      agentIds: [],
      state: FlowVersionState.LOCKED,
      connectionIds: [],
      backupFiles: null,
      notes: [],
      trigger: {
        name: 'trigger',
        valid: true,
        displayName: 'Trigger',
        type: FlowTriggerType.EMPTY,
        settings: {},
        lastUpdatedDate: NOW,
        nextAction: {
          name: 'batches',
          valid: true,
          displayName: 'batches',
          lastUpdatedDate: NOW,
          type: FlowActionType.PROCESS_IN_BATCHES,
          settings: {
            items: '{{ trigger.rows }}',
            batchSize: 10,
            errorHandlingOptions: {},
          },
          firstLoopAction: {
            name: 'code_in_batch',
            valid: true,
            displayName: 'code_in_batch',
            lastUpdatedDate: NOW,
            type: FlowActionType.CODE,
            settings: {
              sourceCode: {
                code: 'export const code = async () => true;',
                packageJson: '{}',
              },
              input: {},
              errorHandlingOptions: {},
            },
          },
        },
      },
    },
  };
}

function buildParentRun(): FlowRun {
  return {
    id: 'parent-run',
    created: NOW,
    updated: NOW,
    projectId: 'project-1',
    flowId: 'flow-1',
    flowVersionId: 'version-1',
    failParentOnFailure: false,
    logsFileId: null,
    status: FlowRunStatus.SUCCEEDED,
    environment: RunEnvironment.PRODUCTION,
    archivedAt: null,
    tags: [],
    steps: {
      batches: new GenericStepOutput({
        type: FlowActionType.PROCESS_IN_BATCHES,
        status: StepOutputStatus.SUCCEEDED,
        input: {},
        output: finishedSummary,
      }),
    },
  };
}

function Probe() {
  observed.push(useBatchLogs('code_in_batch'));
  return null;
}

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('useBatchLogs', () => {
  let container: HTMLDivElement;
  let root: Root;
  let queryClient: QueryClient;

  beforeEach(() => {
    observed.length = 0;
    harness.list.mockReset();
    harness.getPopulated.mockReset();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    queryClient.clear();
  });

  async function render() {
    const flow = buildFlow();
    const store = createBuilderStore({
      flow,
      flowVersion: flow.version,
      readonly: true,
      hideTestWidget: false,
      run: buildParentRun(),
      outputSampleData: {},
      inputSampleData: {},
      socket: io('http://localhost', { autoConnect: false }),
      queryClient,
    });
    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <BuilderStateContext.Provider value={store}>
            <Probe />
          </BuilderStateContext.Provider>
        </QueryClientProvider>,
      );
    });
    await flush();
  }

  it('reports a failed batch lookup as an error, not as a batch that never started', async () => {
    harness.list.mockRejectedValue(new Error('network down'));

    await render();

    const logs = observed.at(-1);
    expect(logs?.kind).toBe('error');

    harness.list.mockResolvedValue({ data: [], next: null, previous: null });
    await act(async () => {
      if (logs?.kind === 'error') {
        await logs.retry();
      }
    });
    await flush();
    expect(harness.list).toHaveBeenCalledTimes(2);
    expect(observed.at(-1)?.kind).toBe('neverStarted');
  });

  it('reports a failed child run fetch as an error, not as expired logs', async () => {
    harness.list.mockResolvedValue({
      data: [
        { id: 'child-1', status: FlowRunStatus.SUCCEEDED, dispatchIndex: 0 },
      ],
      next: null,
      previous: null,
    });
    harness.getPopulated.mockRejectedValue(new Error('network down'));

    await render();
    await flush();

    expect(observed.at(-1)).toMatchObject({
      kind: 'error',
      childRunId: 'child-1',
    });
  });
});
