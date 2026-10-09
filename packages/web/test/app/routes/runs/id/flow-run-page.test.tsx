// @vitest-environment jsdom
import { FlowRun, PopulatedFlow } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { AxiosError, AxiosResponse } from 'axios';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({
  t: (key: string, options?: { entity?: string }) =>
    options?.entity ? key.replace('{entity}', options.entity) : key,
}));
vi.mock('react-router-dom', () => ({
  useParams: () => ({ runId: 'run_1', projectId: 'project_1' }),
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}));
vi.mock('@xyflow/react', () => ({
  ReactFlowProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('@/app/builder', () => ({
  BuilderPage: () => <div>builder-page</div>,
}));
vi.mock('@/app/builder/state/builder-state-provider', () => ({
  BuilderStateProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('@/components/custom/spinner', () => ({
  LoadingSpinner: () => <div>loading</div>,
}));

const getPopulatedRun = vi.fn();
const getFlow = vi.fn();
vi.mock('@/features/flow-runs', () => ({
  flowRunsApi: { getPopulated: (id: string) => getPopulatedRun(id) },
}));
vi.mock('@/features/flows', () => ({
  flowsApi: {
    get: (id: string, request: unknown) => getFlow(id, request),
  },
  sampleDataHooks: {
    useSampleDataForFlow: () => ({ data: {}, isLoading: false }),
    useSampleDataInputForFlow: () => ({ data: {}, isLoading: false }),
  },
}));

import { FlowRunPage } from '@/app/routes/runs/id';

const run = {
  id: 'run_1',
  flowId: 'flow_1',
  flowVersionId: 'version_1',
} as unknown as FlowRun;

const flow = {
  id: 'flow_1',
  version: { id: 'version_1' },
} as unknown as PopulatedFlow;

const notFoundError = new AxiosError(
  'Not Found',
  'ERR_BAD_REQUEST',
  undefined,
  undefined,
  {
    status: 404,
    data: { code: 'ENTITY_NOT_FOUND', params: {} },
  } as AxiosResponse,
);

const ERROR_TITLE = 'Trouble loading this run';

async function advance(ms: number) {
  await act(() => vi.advanceTimersByTimeAsync(ms));
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function renderPage(queryClient = createQueryClient()) {
  render(
    <QueryClientProvider client={queryClient}>
      <FlowRunPage />
    </QueryClientProvider>,
  );
}

describe('FlowRunPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    getPopulatedRun.mockReset();
    getFlow.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the builder when the run and flow load', async () => {
    getPopulatedRun.mockResolvedValue(run);
    getFlow.mockResolvedValue(flow);

    renderPage();

    await screen.findByText('builder-page');
    expect(getFlow).toHaveBeenCalledWith('flow_1', { versionId: 'version_1' });
  });

  it('shows an error state with retry once the run fetch keeps failing', async () => {
    getPopulatedRun.mockRejectedValue(new Error('500'));

    renderPage();
    await advance(10000);

    await screen.findByText(ERROR_TITLE);
    screen.getByText('Try again');
    expect(getPopulatedRun).toHaveBeenCalledTimes(4);
    expect(screen.queryAllByText('builder-page')).toHaveLength(0);
  });

  it('shows an error state when the flow version fetch fails', async () => {
    getPopulatedRun.mockResolvedValue(run);
    getFlow.mockRejectedValue(new Error('403'));

    renderPage();
    await advance(10000);

    await screen.findByText(ERROR_TITLE);
    expect(screen.queryAllByText('builder-page')).toHaveLength(0);
  });

  it('shows run not found without retrying when the run does not exist', async () => {
    getPopulatedRun.mockRejectedValue(notFoundError);

    renderPage();

    await screen.findByText('Run not found');
    expect(getPopulatedRun).toHaveBeenCalledTimes(1);
    expect(screen.queryAllByText(ERROR_TITLE)).toHaveLength(0);
  });

  it('shows run not found when the flow version was deleted', async () => {
    getPopulatedRun.mockResolvedValue(run);
    getFlow.mockRejectedValue(notFoundError);

    renderPage();

    await screen.findByText('Run not found');
    expect(screen.queryAllByText('builder-page')).toHaveLength(0);
  });

  it('loads the run after retrying from the error state', async () => {
    getPopulatedRun.mockRejectedValue(new Error('500'));
    getFlow.mockResolvedValue(flow);

    renderPage();
    await advance(10000);

    getPopulatedRun.mockResolvedValue(run);
    fireEvent.click(await screen.findByText('Try again'));

    await screen.findByText('builder-page');
    expect(screen.queryAllByText(ERROR_TITLE)).toHaveLength(0);
  });

  it('stops polling while the error state is shown', async () => {
    getPopulatedRun.mockRejectedValue(new Error('500'));

    renderPage();
    await advance(10000);
    await screen.findByText(ERROR_TITLE);
    const callsAtError = getPopulatedRun.mock.calls.length;

    await advance(60000);

    expect(getPopulatedRun).toHaveBeenCalledTimes(callsAtError);
  });

  it('keeps polling a loaded run', async () => {
    getPopulatedRun.mockResolvedValue(run);
    getFlow.mockResolvedValue(flow);

    renderPage();
    await screen.findByText('builder-page');

    await advance(15000);

    expect(getPopulatedRun).toHaveBeenCalledTimes(2);
  });

  it('keeps the loaded run on screen when a background refetch fails', async () => {
    getPopulatedRun.mockResolvedValue(run);
    getFlow.mockResolvedValue(flow);

    const queryClient = createQueryClient();
    renderPage(queryClient);
    await screen.findByText('builder-page');

    getPopulatedRun.mockRejectedValue(new Error('500'));
    act(() => {
      queryClient
        .refetchQueries({ queryKey: ['run', 'run_1'] })
        .catch(() => undefined);
    });
    await advance(10000);

    screen.getByText('builder-page');
    expect(screen.queryAllByText(ERROR_TITLE)).toHaveLength(0);
  });

  it('stops polling a loaded run once it is deleted', async () => {
    getPopulatedRun.mockResolvedValue(run);
    getFlow.mockResolvedValue(flow);

    renderPage();
    await screen.findByText('builder-page');

    getPopulatedRun.mockRejectedValue(notFoundError);
    await advance(15000);
    const callsAfterNotFound = getPopulatedRun.mock.calls.length;
    await advance(60000);

    expect(callsAfterNotFound).toBe(2);
    expect(getPopulatedRun).toHaveBeenCalledTimes(callsAfterNotFound);
  });
});
