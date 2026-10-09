/**
 * @vitest-environment jsdom
 *
 * Regression guard for https://github.com/activepieces/activepieces/issues/13554
 *
 * refreshTableState() rebuilds the table store in place (instead of
 * window.location.reload(), which breaks the embed iframe). For that to be
 * lock-safe, TableLockProvider — which owns useResourceLock — MUST stay mounted
 * ABOVE the key={refreshKey} remount boundary of TableStateProviderWithTable.
 * If the lock hook were remounted on refresh, its cleanup would emit a spurious
 * UNLOCK_RESOURCE and briefly release the just-acquired lock for other clients.
 *
 * This test renders the real ApTableStateProvider and asserts the lock hook is
 * mounted exactly once and survives a refreshTableState() call, while the table
 * subtree below the key does remount.
 *
 * Uses raw react-dom + React's act rather than @testing-library/react (not a
 * dependency of this package).
 */
/* eslint-disable testing-library/no-unnecessary-act */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { recordsApi } from '@/features/tables/api/records-api';
import {
  ApTableStateProvider,
  useOptionalTableStore,
  useRefreshTableState,
} from '@/features/tables/components/ap-table-state-provider';
import { ApTableStore } from '@/features/tables/stores/store/ap-tables-client-state';

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const harness = vi.hoisted<{
  lockEvents: string[];
  probeMounts: { count: number };
  captured: {
    refresh: (() => Promise<void>) | undefined;
    store: ApTableStore | undefined;
  };
}>(() => ({
  lockEvents: [] as string[],
  probeMounts: { count: 0 },
  captured: {
    refresh: undefined,
    store: undefined,
  },
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/hooks/use-resource-lock', () => ({
  useResourceLock: () => {
    useEffect(() => {
      harness.lockEvents.push('mount');
      return () => {
        harness.lockEvents.push('unmount');
      };
    }, []);
    return { lockedBy: null, takeOver: () => undefined };
  },
}));

vi.mock('@/components/custom/route-loading-bar', () => ({
  RouteLoadingBar: () => null,
}));

vi.mock('@/features/tables/api/tables-api', () => ({
  tablesApi: { getById: vi.fn().mockResolvedValue({ id: 't1', name: 'T' }) },
}));

vi.mock('@/features/tables/api/fields-api', () => ({
  fieldsApi: { list: vi.fn().mockResolvedValue([]) },
}));

vi.mock('@/features/tables/api/records-api', () => ({
  recordsApi: {
    list: vi.fn().mockResolvedValue({
      data: [{ id: 'record-1', cells: {} }],
    }),
    delete: vi.fn(),
  },
}));

function RefreshProbe() {
  const refresh = useRefreshTableState();
  const store = useOptionalTableStore();
  harness.captured.store = store ?? undefined;
  useEffect(() => {
    harness.captured.refresh = refresh;
  }, [refresh]);
  useEffect(() => {
    harness.probeMounts.count += 1;
  }, []);
  return null;
}

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('ApTableStateProvider lock hoisting (GIT-1529)', () => {
  let container: HTMLDivElement;
  let root: Root;
  let queryClient: QueryClient;

  beforeEach(() => {
    harness.lockEvents.length = 0;
    harness.probeMounts.count = 0;
    harness.captured.refresh = undefined;
    harness.captured.store = undefined;
    vi.mocked(recordsApi.list).mockResolvedValue({
      data: [
        {
          id: 'record-1',
          created: '2026-10-09T00:00:00.000Z',
          updated: '2026-10-09T00:00:00.000Z',
          tableId: 't1',
          projectId: 'project-1',
          cells: {},
        },
      ],
      next: null,
      previous: null,
    });
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
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

  it('keeps the lock hook mounted across a refreshTableState while the table subtree remounts', async () => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/tables/t1']}>
          <QueryClientProvider client={queryClient}>
            <Routes>
              <Route
                path="/tables/:tableId"
                element={
                  <ApTableStateProvider>
                    <RefreshProbe />
                  </ApTableStateProvider>
                }
              />
            </Routes>
          </QueryClientProvider>
        </MemoryRouter>,
      );
    });

    // let the three queries resolve so the provider renders its children
    for (let i = 0; i < 5 && harness.lockEvents.length === 0; i++) {
      await flush();
    }

    expect(harness.lockEvents).toEqual(['mount']);
    expect(harness.probeMounts.count).toBe(1);
    expect(harness.captured.refresh).toBeDefined();

    await act(async () => {
      await harness.captured.refresh?.();
    });
    await flush();

    // the lock hook must NOT have been unmounted/remounted by the refresh...
    expect(harness.lockEvents).toEqual(['mount']);
    // ...but the keyed table subtree below it must have remounted
    expect(harness.probeMounts.count).toBe(2);
  });

  it('blocks editing after a failed save and rebuilds the store only after a successful reload', async () => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/tables/t1']}>
          <QueryClientProvider client={queryClient}>
            <Routes>
              <Route
                path="/tables/:tableId"
                element={
                  <ApTableStateProvider>
                    <RefreshProbe />
                    <span>Table editor</span>
                  </ApTableStateProvider>
                }
              />
            </Routes>
          </QueryClientProvider>
        </MemoryRouter>,
      );
    });
    for (let i = 0; i < 5 && !harness.captured.store; i++) {
      await flush();
    }

    const failedStore = harness.captured.store;
    vi.mocked(recordsApi.delete).mockRejectedValueOnce(
      new Error('Delete failed'),
    );
    await act(async () => {
      failedStore?.getState().deleteRecords(['0']);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(failedStore?.getState().hasSaveError).toBe(true);
    expect(
      container.textContent?.includes('Table changes could not be saved'),
    ).toBe(true);
    expect(container.textContent?.includes('Table editor')).toBe(false);

    vi.mocked(recordsApi.list).mockRejectedValueOnce(
      new Error('Reload failed'),
    );
    await act(async () => {
      await expect(harness.captured.refresh?.()).rejects.toThrow(
        'Reload failed',
      );
    });
    expect(harness.captured.store).toBe(failedStore);
    expect(failedStore?.getState().hasSaveError).toBe(true);
    expect(container.textContent?.includes('Table editor')).toBe(false);

    await act(async () => {
      await queryClient.refetchQueries({ queryKey: ['records', 't1'] });
    });
    expect(harness.captured.store).toBe(failedStore);
    expect(failedStore?.getState().hasSaveError).toBe(true);
    expect(
      container.textContent?.includes('Table changes could not be saved'),
    ).toBe(true);
    expect(container.textContent?.includes('Table editor')).toBe(false);

    await act(async () => {
      await harness.captured.refresh?.();
    });
    await flush();

    expect(harness.captured.store).not.toBe(failedStore);
    expect(harness.captured.store?.getState().hasSaveError).toBe(false);
    expect(container.textContent?.includes('Table editor')).toBe(true);
    expect(
      container.textContent?.includes('Table changes could not be saved'),
    ).toBe(false);
  });

  it('shows a retry action when the initial records fetch fails', async () => {
    vi.mocked(recordsApi.list).mockRejectedValueOnce(new Error('Load failed'));
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/tables/t1']}>
          <QueryClientProvider client={queryClient}>
            <Routes>
              <Route
                path="/tables/:tableId"
                element={
                  <ApTableStateProvider>
                    <span>Table editor</span>
                  </ApTableStateProvider>
                }
              />
            </Routes>
          </QueryClientProvider>
        </MemoryRouter>,
      );
    });
    await flush();
    expect(container.textContent?.includes('Table not available')).toBe(true);
    expect(container.textContent?.includes('Table editor')).toBe(false);
    const retryButton = container.querySelector('button');
    expect(retryButton?.textContent).toBe('Try again');

    await act(async () => {
      retryButton?.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    await flush();
    expect(container.textContent?.includes('Table editor')).toBe(true);
    expect(container.textContent?.includes('Table not available')).toBe(false);
  });
});
