// @vitest-environment jsdom
import {
  EmptyTrigger,
  FlowActionType,
  FlowRunStatus,
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

describe('flowRunQueries.useBatchChildren polling', () => {
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
    renderBatchList({ allBatchesTerminal: false });
    await vi.advanceTimersByTimeAsync(0);
    expect(listRuns).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);

    expect(listRuns).toHaveBeenCalledTimes(2);
  });

  it('stops polling once every batch has settled', async () => {
    renderBatchList({ allBatchesTerminal: true });
    await vi.advanceTimersByTimeAsync(0);

    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 2);

    expect(listRuns).toHaveBeenCalledTimes(1);
  });

  it('refreshes once after the batches settle, then stops', async () => {
    const { rerender } = renderBatchList({ allBatchesTerminal: false });
    await vi.advanceTimersByTimeAsync(0);
    expect(listRuns).toHaveBeenCalledTimes(1);

    rerender({ allBatchesTerminal: true });
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    expect(listRuns).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 2);
    expect(listRuns).toHaveBeenCalledTimes(2);
  });

  it('stops every observer of the same list, not only the one whose query function ran', async () => {
    const { rerender } = renderHook(
      ({ allBatchesTerminal }: { allBatchesTerminal: boolean }) => {
        const options = {
          barrierId: 'barrier_id',
          limit: 50,
          statuses: undefined,
          enabled: true,
          allBatchesTerminal,
        };
        flowRunQueries.useBatchChildren(options);
        return flowRunQueries.useBatchChildren(options);
      },
      {
        initialProps: { allBatchesTerminal: false },
        wrapper: wrapperFor(queryClient),
      },
    );
    await vi.advanceTimersByTimeAsync(0);
    expect(listRuns).toHaveBeenCalledTimes(1);

    rerender({ allBatchesTerminal: true });
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    const callsAfterRefresh = listRuns.mock.calls.length;

    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 3);
    expect(listRuns).toHaveBeenCalledTimes(callsAfterRefresh);
  });

  function renderBatchList(initialProps: { allBatchesTerminal: boolean }) {
    return renderHook(
      ({ allBatchesTerminal }: { allBatchesTerminal: boolean }) =>
        flowRunQueries.useBatchChildren({
          barrierId: 'barrier_id',
          limit: 50,
          statuses: undefined,
          enabled: true,
          allBatchesTerminal,
        }),
      { initialProps, wrapper: wrapperFor(queryClient) },
    );
  }
});

describe('flowRunQueries.useBatchChildByIndex polling', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.useFakeTimers();
    listRuns.mockReset();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  afterEach(() => {
    queryClient.clear();
    vi.useRealTimers();
  });

  it('fetches once more after the summary arrives, so a child created after the last poll still shows', async () => {
    listRuns.mockResolvedValueOnce({ data: [], next: null, previous: null });
    listRuns.mockResolvedValue({
      data: [{ id: 'child_id', status: FlowRunStatus.SUCCEEDED }],
      next: null,
      previous: null,
    });
    const { result, rerender } = renderBatchChild({ hasBatchSummary: false });
    await vi.advanceTimersByTimeAsync(0);
    expect(listRuns).toHaveBeenCalledTimes(1);

    rerender({ hasBatchSummary: true });
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);

    expect(listRuns).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 2);
    expect(listRuns).toHaveBeenCalledTimes(2);
    await vi.waitFor(() =>
      expect(result.current.data?.data[0]?.id).toBe('child_id'),
    );
  });

  it('stops after one fetch when the summary is already there and the batch has no child', async () => {
    listRuns.mockResolvedValue({ data: [], next: null, previous: null });
    renderBatchChild({ hasBatchSummary: true });
    await vi.advanceTimersByTimeAsync(0);

    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 2);

    expect(listRuns).toHaveBeenCalledTimes(1);
  });

  function renderBatchChild(initialProps: { hasBatchSummary: boolean }) {
    return renderHook(
      ({ hasBatchSummary }: { hasBatchSummary: boolean }) =>
        flowRunQueries.useBatchChildByIndex({
          barrierId: 'barrier_id',
          dispatchIndex: 3,
          enabled: true,
          hasBatchSummary,
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
      flowWithVersion({ state: DRAFT, batch: false }),
    );
    const first = renderMayProcessInBatches();
    await vi.waitFor(() => expect(getFlow).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(first.result.current).toBe(false));
    first.unmount();

    getFlow.mockResolvedValueOnce(flowWithVersion({ state: DRAFT, batch: true }));
    const second = renderMayProcessInBatches();

    await vi.waitFor(() => expect(second.result.current).toBe(true));
    expect(getFlow).toHaveBeenCalledTimes(2);
  });

  it('keeps a locked version cached, because it can never change', async () => {
    getFlow.mockResolvedValue(flowWithVersion({ state: LOCKED, batch: false }));
    const first = renderMayProcessInBatches();
    await vi.waitFor(() => expect(first.result.current).toBe(false));
    first.unmount();

    const second = renderMayProcessInBatches();

    expect(second.result.current).toBe(false);
    expect(getFlow).toHaveBeenCalledTimes(1);
  });

  function renderMayProcessInBatches() {
    return renderGate({
      queryClient,
      runs: [{ flowId: 'flow_id', flowVersionId: 'version_id' }],
      includesUnlistedRuns: false,
      enabled: true,
    });
  }
});

describe('flowRunQueries.useMayProcessInBatches gate', () => {
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

  it('warns for a select-all selection, because it holds runs the table never listed', () => {
    getFlow.mockResolvedValue(flowWithVersion({ state: LOCKED, batch: false }));

    const { result } = renderGate({
      queryClient,
      runs: [{ flowId: 'flow_id', flowVersionId: 'version_id' }],
      includesUnlistedRuns: true,
      enabled: true,
    });

    expect(result.current).toBe(true);
  });

  it('warns past ten versions and fetches only the first ten', async () => {
    getFlow.mockResolvedValue(flowWithVersion({ state: LOCKED, batch: false }));
    const runs = Array.from({ length: 11 }, (_, index) => ({
      flowId: 'flow_id',
      flowVersionId: `version_${index}`,
    }));

    const { result } = renderGate({
      queryClient,
      runs,
      includesUnlistedRuns: false,
      enabled: true,
    });

    await vi.waitFor(() => expect(getFlow).toHaveBeenCalledTimes(10));
    expect(result.current).toBe(true);
  });

  it('warns while a version is still loading', () => {
    getFlow.mockReturnValue(new Promise(() => undefined));

    const { result } = renderGate({
      queryClient,
      runs: [{ flowId: 'flow_id', flowVersionId: 'version_id' }],
      includesUnlistedRuns: false,
      enabled: true,
    });

    expect(result.current).toBe(true);
  });

  it('warns when a version fails to load', async () => {
    getFlow.mockRejectedValue(new Error('network'));

    const { result } = renderGate({
      queryClient,
      runs: [{ flowId: 'flow_id', flowVersionId: 'version_id' }],
      includesUnlistedRuns: false,
      enabled: true,
    });

    await vi.waitFor(() =>
      expect(
        queryClient.getQueryCache().findAll({ type: 'all' })[0]?.state.status,
      ).toBe('error'),
    );
    expect(result.current).toBe(true);
  });

  it('fetches no version while disabled', () => {
    renderGate({
      queryClient,
      runs: [{ flowId: 'flow_id', flowVersionId: 'version_id' }],
      includesUnlistedRuns: false,
      enabled: false,
    });

    expect(getFlow).not.toHaveBeenCalled();
  });
});

function renderGate({
  queryClient,
  runs,
  includesUnlistedRuns,
  enabled,
}: {
  queryClient: QueryClient;
  runs: { flowId: string; flowVersionId: string }[];
  includesUnlistedRuns: boolean;
  enabled: boolean;
}) {
  return renderHook(
    () =>
      flowRunQueries.useMayProcessInBatches({
        runs,
        includesUnlistedRuns,
        enabled,
      }),
    { wrapper: wrapperFor(queryClient) },
  );
}

function wrapperFor(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

function flowWithVersion({
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
