/**
 * @vitest-environment jsdom
 */
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const toast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('sonner', () => ({ toast }));
vi.mock('i18next', () => ({ t: (key: string) => key }));

import {
  OptimisticMutationConfig,
  useOptimisticMutation,
} from '@/hooks/use-optimistic-mutation';
import { mutationFeedback } from '@/lib/mutation-feedback';

const KEY = ['team'];

const setup = (
  overrides: Partial<OptimisticMutationConfig<Rename, Team, Team>> = {},
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  queryClient.setQueryData<Team>(KEY, { name: 'Ops' });
  const mutationFn = vi.fn(async ({ name }: Rename) => ({ name }));
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  const { result } = renderHook(
    () =>
      useOptimisticMutation<Rename, Team, Team>({
        mutationFn,
        queryKey: KEY,
        apply: ({ current, vars }) => ({ ...current, name: vars.name }),
        ...overrides,
      }),
    { wrapper },
  );
  return {
    queryClient,
    mutationFn,
    result,
    cached: () => queryClient.getQueryData<Team>(KEY),
  };
};

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

beforeEach(() => {
  toast.success.mockReset();
  toast.error.mockReset();
});

describe('useOptimisticMutation', () => {
  it('applies the change to the cache before the server answers', async () => {
    const pending = deferred<Team>();
    const { result, cached } = setup({ mutationFn: () => pending.promise });

    act(() => result.current.mutate({ name: 'Platform' }));

    await waitFor(() => expect(cached()).toEqual({ name: 'Platform' }));
    pending.resolve({ name: 'Platform' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('rolls back and shows the server error when the save fails', async () => {
    const failure = new Error('Name is taken');
    const { result, cached } = setup({
      mutationFn: () => Promise.reject(failure),
      errorTitle: "Couldn't rename",
    });

    act(() => result.current.mutate({ name: 'Platform' }));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(cached()).toEqual({ name: 'Ops' });
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith("Couldn't rename", {
      id: 'mutation-error',
      description: 'Name is taken',
    });
    expect(mutationFeedback.wasShown(failure)).toBe(true);
  });

  it('shows the success message', async () => {
    const { result } = setup({
      success: ({ vars }) => `Renamed to ${vars.name}`,
    });

    await act(() => result.current.mutateAsync({ name: 'Platform' }));

    expect(toast.success).toHaveBeenCalledWith('Renamed to Platform');
  });

  it('stays quiet on success when no message is given', async () => {
    const { result } = setup();

    await act(() => result.current.mutateAsync({ name: 'Platform' }));

    expect(toast.success).not.toHaveBeenCalled();
  });

  it('offers undo, which sends the previous value without a second success toast', async () => {
    const { result, mutationFn, cached } = setup({
      success: ({ vars }) => `Renamed to ${vars.name}`,
      undo: ({ previous }) => ({ name: previous?.name ?? '' }),
    });

    await act(() => result.current.mutateAsync({ name: 'Platform' }));

    expect(toast.success).toHaveBeenCalledTimes(1);
    const [message, options] = toast.success.mock.calls[0];
    expect(message).toBe('Renamed to Platform');
    expect(options.action.label).toBe('Undo');

    await act(async () => options.action.onClick());

    await waitFor(() =>
      expect(toast.success).toHaveBeenLastCalledWith('Undone'),
    );
    expect(toast.success).toHaveBeenCalledTimes(2);
    expect(mutationFn).toHaveBeenLastCalledWith({ name: 'Ops' });
    expect(cached()).toEqual({ name: 'Ops' });
  });

  it('uses a generic message for the undo toast when no success message is given', async () => {
    const { result } = setup({
      undo: ({ previous }) => ({ name: previous?.name ?? '' }),
    });

    await act(() => result.current.mutateAsync({ name: 'Platform' }));

    expect(toast.success.mock.calls[0][0]).toBe('Changes saved');
  });

  it('shows one error when the undo itself fails', async () => {
    const undoFailure = new Error('Undo refused');
    const mutationFn = vi
      .fn<(vars: Rename) => Promise<Team>>()
      .mockResolvedValueOnce({ name: 'Platform' })
      .mockRejectedValueOnce(undoFailure);
    const { result, cached } = setup({
      mutationFn,
      undo: ({ previous }) => ({ name: previous?.name ?? '' }),
    });

    await act(() => result.current.mutateAsync({ name: 'Platform' }));
    const [, options] = toast.success.mock.calls[0];
    await act(async () => options.action.onClick());

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(toast.error.mock.calls[0][0]).toBe("Couldn't undo");
    expect(cached()).toEqual({ name: 'Platform' });
    expect(toast.success).toHaveBeenCalledTimes(1);
  });

  it('invalidates the query key and the extra keys when it settles', async () => {
    const { result, queryClient } = setup({ invalidate: [['team-members']] });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    await act(() => result.current.mutateAsync({ name: 'Platform' }));

    expect(invalidate).toHaveBeenCalledWith({ queryKey: KEY });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['team-members'] });
  });

  it('runs saves in the same scope one at a time', async () => {
    const first = deferred<Team>();
    const mutationFn = vi
      .fn<(vars: Rename) => Promise<Team>>()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(async (vars) => vars);
    const { result } = setup({ mutationFn, scope: 'team' });

    act(() => {
      result.current.mutate({ name: 'A' });
      result.current.mutate({ name: 'B' });
    });

    await waitFor(() => expect(mutationFn).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(mutationFn).toHaveBeenCalledTimes(1);

    first.resolve({ name: 'A' });
    await waitFor(() => expect(mutationFn).toHaveBeenCalledTimes(2));
    expect(mutationFn).toHaveBeenLastCalledWith({ name: 'B' });
  });

  it('leaves queries that have no data yet alone', async () => {
    const { result, queryClient } = setup();
    queryClient.removeQueries({ queryKey: KEY });
    const apply = vi.fn();

    const { result: other } = renderHook(
      () =>
        useOptimisticMutation<Rename, Team, Team>({
          mutationFn: async (vars) => vars,
          queryKey: KEY,
          apply,
        }),
      {
        wrapper: ({ children }) =>
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children,
          ),
      },
    );

    await act(() => other.current.mutateAsync({ name: 'Platform' }));

    expect(apply).not.toHaveBeenCalled();
    expect(result.current.isIdle).toBe(true);
  });
});

describe('useOptimisticMutation with saves in flight', () => {
  const removeOneThenAnother = async (remove: (value: string) => void) => {
    act(() => remove('a.com'));
    await act(() => new Promise((resolve) => setTimeout(resolve, 5)));
    act(() => remove('b.com'));
  };

  const LIST_KEY = ['domains'];

  const setupList = () => {
    const server = { list: ['a.com', 'b.com', 'c.com'] };
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0 } },
    });
    const seen: string[][] = [];
    const mutationFn = vi.fn(async () => {
      const latest = queryClient.getQueryData<string[]>(LIST_KEY) ?? [];
      await new Promise((resolve) => setTimeout(resolve, 20));
      server.list = latest;
      return latest;
    });
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children,
      );
    const { result } = renderHook(
      () => {
        const query = useQuery({
          queryKey: LIST_KEY,
          queryFn: async () => {
            await new Promise((resolve) => setTimeout(resolve, 5));
            return [...server.list];
          },
        });
        if (query.data !== undefined) {
          seen.push(query.data);
        }
        const mutation = useOptimisticMutation<string, string[], string[]>({
          mutationFn,
          queryKey: LIST_KEY,
          scope: 'domains',
          apply: ({ current, vars }) => current.filter((item) => item !== vars),
          success: ({ vars }) => `${vars} removed`,
        });
        return { query, mutation };
      },
      { wrapper },
    );
    return { server, queryClient, result, seen };
  };

  it('keeps both changes when two items are removed quickly', async () => {
    const { server, result, queryClient } = setupList();
    await waitFor(() => expect(result.current.query.data).toHaveLength(3));

    await removeOneThenAnother(result.current.mutation.mutate);

    await waitFor(() => expect(queryClient.isMutating()).toBe(0));
    await waitFor(() => expect(result.current.query.data).toEqual(['c.com']));
    expect(server.list).toEqual(['c.com']);
    expect(toast.success).toHaveBeenCalledWith('a.com removed');
    expect(toast.success).toHaveBeenCalledWith('b.com removed');
  });

  it('never shows a removed item again while a later save is pending', async () => {
    const { result, queryClient, seen } = setupList();
    await waitFor(() => expect(result.current.query.data).toHaveLength(3));

    await removeOneThenAnother(result.current.mutation.mutate);
    await waitFor(() => expect(queryClient.isMutating()).toBe(0));
    await waitFor(() => expect(result.current.query.data).toEqual(['c.com']));

    const firstWithoutB = seen.findIndex((list) => !list.includes('b.com'));
    expect(firstWithoutB).toBeGreaterThan(-1);
    expect(
      seen.slice(firstWithoutB).some((list) => list.includes('b.com')),
    ).toBe(false);
  });

  it('refetches once, after the last save in flight settles', async () => {
    const { result, queryClient } = setupList();
    await waitFor(() => expect(result.current.query.data).toHaveLength(3));
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    await removeOneThenAnother(result.current.mutation.mutate);
    await waitFor(() => expect(queryClient.isMutating()).toBe(0));

    expect(invalidate).toHaveBeenCalledTimes(1);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: LIST_KEY });
  });

  it('flushes the extra keys of an earlier save with the last one', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData<Team>(KEY, { name: 'Ops' });
    const first = deferred<Team>();
    const mutationFn = vi
      .fn<(vars: Rename) => Promise<Team>>()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(async (vars) => vars);
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children,
      );
    const { result } = renderHook(
      () =>
        useOptimisticMutation<Rename, Team, Team>({
          mutationFn,
          queryKey: KEY,
          scope: 'team',
          invalidate: [['team-members']],
          apply: ({ current, vars }) => ({ ...current, name: vars.name }),
        }),
      { wrapper },
    );
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    act(() => {
      result.current.mutate({ name: 'A' });
      result.current.mutate({ name: 'B' });
    });
    first.resolve({ name: 'A' });
    await waitFor(() => expect(queryClient.isMutating()).toBe(0));

    expect(invalidate).toHaveBeenCalledTimes(2);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: KEY });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['team-members'] });
    expect(queryClient.getQueryData<Team>(KEY)).toEqual({ name: 'B' });
  });
});

type Team = { name: string };

type Rename = { name: string };
