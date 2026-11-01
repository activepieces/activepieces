/**
 * @vitest-environment jsdom
 *
 * useBatchChildRun backs the batch browser: selecting a batch swaps its child
 * run id and the run detail panel gates on isLoading. placeholderData /
 * keepPreviousData would keep the previous child's run in `data` with
 * status 'success' on the new key, so the panel would render the previous
 * batch's steps under the newly selected batch. This pins isLoading.
 *
 * This file uses raw `react-dom` + React's `act` rather than
 * @testing-library/react (which is not a dependency of this package).
 */
/* eslint-disable testing-library/no-unnecessary-act */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { flowRunQueries } from '@/features/flow-runs/hooks/flow-run-hooks';

declare global {
  // Tells React the test wraps updates in act(); see React's act() docs.
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const harness = vi.hoisted(() => ({
  getPopulated: vi.fn(),
}));

vi.mock('@/features/flow-runs/api/flow-runs-api', () => ({
  flowRunsApi: {
    getPopulated: harness.getPopulated,
  },
}));

const observed: { data: unknown; isLoading: boolean }[] = [];

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function Probe({ childRunId }: { childRunId: string | null }) {
  const { data, isLoading } = flowRunQueries.useBatchChildRun({ childRunId });
  observed.push({ data, isLoading });
  return null;
}

describe('useBatchChildRun', () => {
  let container: HTMLDivElement;
  let root: Root;
  let queryClient: QueryClient;

  beforeEach(() => {
    observed.length = 0;
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

  it('reports loading instead of the previous child when the selected batch changes', async () => {
    harness.getPopulated.mockImplementation((runId: string) =>
      runId === 'child-a'
        ? Promise.resolve({ id: 'child-a', status: 'SUCCEEDED', steps: {} })
        : new Promise(() => undefined),
    );

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <Probe childRunId="child-a" />
        </QueryClientProvider>,
      );
    });
    await flush();
    expect(observed.at(-1)?.data).toEqual({
      id: 'child-a',
      status: 'SUCCEEDED',
      steps: {},
    });

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <Probe childRunId="child-b" />
        </QueryClientProvider>,
      );
    });
    await flush();

    expect(observed.at(-1)?.data).toBeUndefined();
    expect(observed.at(-1)?.isLoading).toBe(true);
  });
});
