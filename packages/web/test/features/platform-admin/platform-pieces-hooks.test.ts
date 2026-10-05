/**
 * @vitest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const toast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  loading: vi.fn(),
  dismiss: vi.fn(),
}));
const update = vi.hoisted(() => vi.fn());

vi.mock('sonner', () => ({ toast }));
vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/api/platforms-api', () => ({ platformApi: { update } }));
vi.mock('@/features/pieces', () => ({
  pieceCacheUtils: { invalidatePieceCaches: vi.fn(async () => []) },
  piecesApi: { syncFromCloud: vi.fn() },
}));

import { platformPiecesMutations } from '@/features/platform-admin/hooks/platform-pieces-hooks';

const PLATFORM_ID = 'pl_1';
const KEY = ['platform', PLATFORM_ID];

const setup = (pinnedPieces: string[]) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  queryClient.setQueryData(KEY, { id: PLATFORM_ID, pinnedPieces });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  const { result } = renderHook(
    () =>
      platformPiecesMutations.useTogglePiecePin({ platformId: PLATFORM_ID }),
    { wrapper },
  );
  return {
    result,
    pinned: () =>
      queryClient.getQueryData<{ pinnedPieces: string[] }>(KEY)?.pinnedPieces,
  };
};

describe('useTogglePiecePin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    update.mockImplementation(async (request: { pinnedPieces: string[] }) => ({
      id: PLATFORM_ID,
      pinnedPieces: request.pinnedPieces,
    }));
  });

  it('pins at once, before the server answers', () => {
    update.mockImplementation(() => new Promise(() => undefined));
    const { result, pinned } = setup(['gmail']);
    act(() => {
      result.current.mutate({
        pieceName: 'slack',
        displayName: 'Slack',
        pinned: true,
      });
    });
    return waitFor(() => expect(pinned()).toEqual(['gmail', 'slack']));
  });

  it('keeps both pins when two are made back to back', async () => {
    const { result } = setup([]);
    act(() => {
      result.current.mutate({
        pieceName: 'slack',
        displayName: 'Slack',
        pinned: true,
      });
      result.current.mutate({
        pieceName: 'gmail',
        displayName: 'Gmail',
        pinned: true,
      });
    });
    await waitFor(() => expect(update).toHaveBeenCalledTimes(2));
    expect(update.mock.calls[1][0]).toEqual({
      pinnedPieces: ['slack', 'gmail'],
    });
  });

  it('rolls back and shows one error when saving fails', async () => {
    update.mockRejectedValue(new Error('boom'));
    const { result, pinned } = setup(['gmail']);
    act(() => {
      result.current.mutate({
        pieceName: 'gmail',
        displayName: 'Gmail',
        pinned: false,
      });
    });
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(pinned()).toEqual(['gmail']);
  });

  it('offers undo that puts an unpinned piece back in its slot', async () => {
    const { result } = setup(['gmail', 'slack', 'notion']);
    act(() => {
      result.current.mutate({
        pieceName: 'slack',
        displayName: 'Slack',
        pinned: false,
      });
    });
    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
    const [, options] = toast.success.mock.calls[0];
    act(() => {
      options.action.onClick();
    });
    await waitFor(() => expect(update).toHaveBeenCalledTimes(2));
    expect(update.mock.calls[1][0]).toEqual({
      pinnedPieces: ['gmail', 'slack', 'notion'],
    });
  });
});
