/**
 * @vitest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiMock, toastMock, writeUpdate } = vi.hoisted(() => ({
  apiMock: {
    post: vi.fn(),
    isError: () => false,
    serverErrorMessage: () => undefined,
    extractServerErrorMessage: (error: unknown, fallback: string) =>
      error instanceof Error ? error.message : fallback,
  },
  toastMock: { success: vi.fn(), error: vi.fn() },
  writeUpdate: vi.fn(),
}));

vi.mock('i18next', () => ({
  t: (key: string, params?: Record<string, unknown>) =>
    params ? `${key} ${JSON.stringify(params)}` : key,
}));
vi.mock('sonner', () => ({ toast: toastMock }));
vi.mock('@/lib/api', () => ({ api: apiMock }));
vi.mock('@/features/projects/stores/project-collection', () => ({
  projectCollection: {
    preload: () => Promise.resolve(),
    utils: { writeUpdate },
  },
}));
vi.mock('@/app/routes/platform/infra/workers/machine-card', () => ({
  workerGroupUtils: { displayName: (label: string) => label },
}));

import {
  useAssignProjectsToGroup,
  useUpdateWorkerSettings,
} from '@/app/routes/platform/infra/workers/worker-settings-mutations';

const PAGE_KEY = ['platform-projects', { limit: 10 }];

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  queryClient.setQueryData(PAGE_KEY, {
    data: [
      { id: 'p1', displayName: 'Billing', workerGroupId: null },
      { id: 'p2', displayName: 'Support', workerGroupId: 'finance' },
    ],
    next: null,
    previous: null,
  });
  const wrapper = ({ children }: React.PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

function cachedGroup({
  queryClient,
  projectId,
}: {
  queryClient: QueryClient;
  projectId: string;
}) {
  const page = queryClient.getQueryData<{
    data: { id: string; workerGroupId: string | null }[];
  }>(PAGE_KEY);
  return page?.data.find((project) => project.id === projectId)?.workerGroupId;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useUpdateWorkerSettings', () => {
  it('moves the project at once and offers an undo that moves it back', async () => {
    let resolveSave: (value: unknown) => void = () => undefined;
    apiMock.post.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const { queryClient, wrapper } = setup();
    const { result } = renderHook(() => useUpdateWorkerSettings(), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        projectId: 'p1',
        projectName: 'Billing',
        next: { workerGroupId: 'finance' },
        previous: { workerGroupId: null },
      });
    });

    await waitFor(() =>
      expect(cachedGroup({ queryClient, projectId: 'p1' })).toBe('finance'),
    );
    resolveSave({ id: 'p1', workerGroupId: 'finance' });
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledTimes(1));
    const [, options] = toastMock.success.mock.calls[0];
    expect(options.action.label).toBe('Undo');

    apiMock.post.mockResolvedValueOnce({ id: 'p1', workerGroupId: null });
    act(() => options.action.onClick());

    await waitFor(() =>
      expect(apiMock.post).toHaveBeenLastCalledWith('/v1/projects/p1', {
        workerGroupId: null,
      }),
    );
    expect(writeUpdate).toHaveBeenCalled();
  });

  it('rolls the row back and shows one error when the save fails', async () => {
    apiMock.post.mockRejectedValueOnce(new Error('Group is offline'));
    const { queryClient, wrapper } = setup();
    const { result } = renderHook(() => useUpdateWorkerSettings(), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        projectId: 'p1',
        projectName: 'Billing',
        next: { workerGroupId: 'finance' },
        previous: { workerGroupId: null },
      });
    });

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledTimes(1));
    expect(toastMock.error.mock.calls[0][1].description).toBe(
      'Group is offline',
    );
    expect(cachedGroup({ queryClient, projectId: 'p1' })).toBeNull();
    expect(toastMock.success).not.toHaveBeenCalled();
  });
});

describe('useAssignProjectsToGroup', () => {
  it('saves in parallel, reports failures and undoes only what was saved', async () => {
    apiMock.post.mockImplementation((url: string) =>
      url.endsWith('/p2')
        ? Promise.reject(new Error('nope'))
        : Promise.resolve({ id: 'p1' }),
    );
    const { wrapper } = setup();
    const { result } = renderHook(() => useAssignProjectsToGroup(), {
      wrapper,
    });

    const outcome = await result.current({
      changes: [
        { projectId: 'p1', next: 'high', previous: null },
        { projectId: 'p2', next: 'high', previous: 'finance' },
      ],
    });

    expect(outcome.failed).toHaveLength(1);
    expect(apiMock.post).toHaveBeenCalledTimes(2);
    const [message, options] = toastMock.success.mock.calls[0];
    expect(message).toContain('"count":1');

    apiMock.post.mockClear();
    apiMock.post.mockResolvedValue({ id: 'p1' });
    await act(async () => options.action.onClick());

    await waitFor(() => expect(apiMock.post).toHaveBeenCalledTimes(1));
    expect(apiMock.post).toHaveBeenCalledWith('/v1/projects/p1', {
      workerGroupId: null,
    });
  });

  it('shows no undo when nothing was saved', async () => {
    apiMock.post.mockRejectedValue(new Error('nope'));
    const { wrapper } = setup();
    const { result } = renderHook(() => useAssignProjectsToGroup(), {
      wrapper,
    });

    const outcome = await result.current({
      changes: [{ projectId: 'p1', next: 'high', previous: null }],
    });

    expect(outcome.failed).toHaveLength(1);
    expect(toastMock.success).not.toHaveBeenCalled();
  });
});
