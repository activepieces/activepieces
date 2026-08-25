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

import {
  ApTableStateProvider,
  useRefreshTableState,
} from '@/features/tables/components/ap-table-state-provider';

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const harness = vi.hoisted(() => ({
  lockEvents: [] as string[],
  probeMounts: { count: 0 },
  captured: { refresh: undefined as undefined | (() => Promise<void>) },
}));

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

vi.mock('@/features/tables/stores/store/ap-tables-client-state', () => ({
  createApTableStore: () => ({}),
}));

vi.mock('@/features/tables/api/tables-api', () => ({
  tablesApi: { getById: vi.fn().mockResolvedValue({ id: 't1', name: 'T' }) },
}));

vi.mock('@/features/tables/api/fields-api', () => ({
  fieldsApi: { list: vi.fn().mockResolvedValue([]) },
}));

vi.mock('@/features/tables/api/records-api', () => ({
  recordsApi: { list: vi.fn().mockResolvedValue({ data: [] }) },
}));

function RefreshProbe() {
  const refresh = useRefreshTableState();
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
});
