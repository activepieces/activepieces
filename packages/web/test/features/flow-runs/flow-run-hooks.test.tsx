// @vitest-environment jsdom
import {
  EmptyTrigger,
  FlowActionType,
  FlowTriggerType,
  FlowVersion,
  FlowVersionState,
} from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { createElement, ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/features/billing', () => ({ billingDialogHooks: {} }));
vi.mock('@/components/ui/sonner', () => ({ internalErrorToast: vi.fn() }));
vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => 'project_id' },
}));

const listRuns = vi.fn();
vi.mock('@/features/flow-runs/api/flow-runs-api', () => ({
  flowRunsApi: { list: (request: unknown) => listRuns(request) },
}));

const getFlow = vi.fn();
vi.mock('@/features/flows/api/flows-api', () => ({
  flowsApi: {
    get: (flowId: string, request: unknown) => getFlow(flowId, request),
  },
}));

import { flowRunQueries } from '@/features/flow-runs/hooks/flow-run-hooks';

describe('flowRunQueries.useBatchChildrenPage polling', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.useFakeTimers();
    listRuns.mockReset();
    listRuns.mockResolvedValue({ data: [], next: null, previous: null });
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  afterEach(() => {
    queryClient.clear();
    vi.useRealTimers();
  });

  it('keeps polling a released barrier while batches are still running', async () => {
    renderBatchList({ allBatchesSettled: false });
    await vi.advanceTimersByTimeAsync(0);
    expect(listRuns).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);

    expect(listRuns).toHaveBeenCalledTimes(2);
  });

  it('stops polling once every batch has settled', async () => {
    renderBatchList({ allBatchesSettled: true });
    await vi.advanceTimersByTimeAsync(0);

    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 2);

    expect(listRuns).toHaveBeenCalledTimes(1);
  });

  it('refreshes once after the batches settle, then stops', async () => {
    const { rerender } = renderBatchList({ allBatchesSettled: false });
    await vi.advanceTimersByTimeAsync(0);
    expect(listRuns).toHaveBeenCalledTimes(1);

    rerender({ allBatchesSettled: true });
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    expect(listRuns).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 2);
    expect(listRuns).toHaveBeenCalledTimes(2);
  });

  function renderBatchList(initialProps: { allBatchesSettled: boolean }) {
    return renderHook(
      ({ allBatchesSettled }: { allBatchesSettled: boolean }) =>
        flowRunQueries.useBatchChildrenPage({
          barrierId: 'barrier_id',
          limit: 50,
          statuses: undefined,
          enabled: true,
          allBatchesSettled,
        }),
      { initialProps, wrapper: wrapperFor(queryClient) },
    );
  }
});

describe('flowRunQueries.useMayProcessInBatches cache', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    getFlow.mockReset();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('reads a draft version again, because a draft can gain a batch step under the same id', async () => {
    getFlow.mockResolvedValueOnce(
      populatedFlow({ state: DRAFT, batch: false }),
    );
    const first = renderMayProcessInBatches();
    await vi.waitFor(() => expect(getFlow).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(first.result.current).toBe(false));
    first.unmount();

    getFlow.mockResolvedValueOnce(populatedFlow({ state: DRAFT, batch: true }));
    const second = renderMayProcessInBatches();

    await vi.waitFor(() => expect(second.result.current).toBe(true));
    expect(getFlow).toHaveBeenCalledTimes(2);
  });

  it('keeps a locked version cached, because it can never change', async () => {
    getFlow.mockResolvedValue(populatedFlow({ state: LOCKED, batch: false }));
    const first = renderMayProcessInBatches();
    await vi.waitFor(() => expect(first.result.current).toBe(false));
    first.unmount();

    const second = renderMayProcessInBatches();

    expect(second.result.current).toBe(false);
    expect(getFlow).toHaveBeenCalledTimes(1);
  });

  function renderMayProcessInBatches() {
    return renderHook(
      () =>
        flowRunQueries.useMayProcessInBatches({
          runs: [{ flowId: 'flow_id', flowVersionId: 'version_id' }],
          includesUnlistedRuns: false,
          enabled: true,
        }),
      { wrapper: wrapperFor(queryClient) },
    );
  }
});

function wrapperFor(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

function populatedFlow({
  state,
  batch,
}: {
  state: FlowVersionState;
  batch: boolean;
}): { version: FlowVersion } {
  const trigger: EmptyTrigger = {
    name: 'trigger',
    valid: false,
    displayName: 'Select Trigger',
    type: FlowTriggerType.EMPTY,
    settings: {},
    lastUpdatedDate: '2026-01-01T00:00:00.000Z',
    nextAction: batch
      ? {
          name: 'batch_step',
          valid: true,
          displayName: 'batch_step',
          lastUpdatedDate: '2026-01-01T00:00:00.000Z',
          type: FlowActionType.PROCESS_IN_BATCHES,
          settings: {
            items: '{{ trigger.rows }}',
            batchSize: 10,
            errorHandlingOptions: {},
          },
        }
      : undefined,
  };
  const version: FlowVersion = {
    id: 'version_id',
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    flowId: 'flow_id',
    displayName: 'Test flow',
    trigger,
    updatedBy: null,
    valid: false,
    schemaVersion: null,
    agentIds: [],
    state,
    connectionIds: [],
    backupFiles: null,
    notes: [],
  };
  return { version };
}

const POLL_INTERVAL_MS = 7000;
const DRAFT = FlowVersionState.DRAFT;
const LOCKED = FlowVersionState.LOCKED;
