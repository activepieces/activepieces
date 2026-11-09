/**
 * @vitest-environment jsdom
 */
import {
  Field,
  FieldType,
  PopulatedRecord,
  Table,
  TableAutomationStatus,
} from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, screen } from '@testing-library/react';
import { AxiosError, AxiosHeaders, HttpStatusCode } from 'axios';
import { useEffect } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fieldsApi } from '@/features/tables/api/fields-api';
import { recordsApi } from '@/features/tables/api/records-api';
import { tablesApi } from '@/features/tables/api/tables-api';
import {
  ApTableStateProvider,
  useRefreshTableState,
  useTableState,
} from '@/features/tables/components/ap-table-state-provider';

const lockHarness = vi.hoisted(() => ({ events: [] as string[] }));

vi.mock('@/components/providers/socket-provider', () => ({
  useSocket: () => ({ connected: false, on: vi.fn(), off: vi.fn() }),
  emitInProject: ({ send }: { send: () => void }) => send(),
  dropHeldEmits: () => undefined,
}));
vi.mock('@/hooks/use-resource-lock', () => ({
  useResourceLock: () => {
    useEffect(() => {
      lockHarness.events.push('mount');
      return () => {
        lockHarness.events.push('unmount');
      };
    }, []);
    return { lockedBy: null, acquiring: false, takeOver: vi.fn() };
  },
}));
vi.mock('@/features/chat/lib/follow/follow-along', () => ({
  followAlong: { flash: vi.fn(), isFollowing: vi.fn(() => false) },
}));
vi.mock('@/features/tables/api/records-api', () => ({
  recordsApi: { list: vi.fn() },
}));
vi.mock('@/features/tables/api/fields-api', () => ({
  fieldsApi: { list: vi.fn() },
}));
vi.mock('@/features/tables/api/tables-api', () => ({
  tablesApi: { getById: vi.fn() },
}));
vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/lib/error-reporting', () => ({
  errorReporting: { report: vi.fn() },
}));

describe('ApTableStateProvider', () => {
  beforeEach(() => {
    lockHarness.events.length = 0;
    vi.mocked(tablesApi.getById).mockResolvedValue(table);
    vi.mocked(fieldsApi.list).mockResolvedValue([nameField]);
    vi.mocked(recordsApi.list).mockResolvedValue({
      data: [record],
      next: null,
      previous: null,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('keeps an open table on screen when a background refetch fails', async () => {
    const queryClient = renderProvider(<Rows />);
    expect(await screen.findByText('Ada')).toBeTruthy();

    vi.mocked(recordsApi.list).mockRejectedValue(new Error('offline'));
    await act(async () => {
      await queryClient.refetchQueries({ queryKey: ['records', 't1'] });
    });

    expect(screen.getByText('Ada')).toBeTruthy();
    expect(screen.queryByText('Table not available')).toBeNull();
  });

  it('keeps the lock hook mounted across a refreshTableState while the table subtree remounts (GIT-1529, #13554)', async () => {
    const probe = { mounts: 0, refresh: null as null | (() => Promise<void>) };
    function RefreshProbe() {
      const refresh = useRefreshTableState();
      probe.refresh = refresh;
      useEffect(() => {
        probe.mounts += 1;
      }, []);
      return <p>ready</p>;
    }
    renderProvider(<RefreshProbe />);
    expect(await screen.findByText('ready')).toBeTruthy();

    expect(lockHarness.events).toEqual(['mount']);
    expect(probe.mounts).toBe(1);

    await act(async () => {
      await probe.refresh?.();
    });

    expect(lockHarness.events).toEqual(['mount']);
    expect(probe.mounts).toBe(2);
  });

  it('shows the table as not available and not editable when it was deleted', async () => {
    vi.mocked(tablesApi.getById).mockRejectedValue(
      httpError(HttpStatusCode.NotFound),
    );

    renderProvider(<Rows />);

    expect(await screen.findByText('Table not available')).toBeTruthy();
    expect(screen.queryByText('Ada')).toBeNull();
    expect(lockHarness.events).toEqual([]);
  });

  it('offers a retry when the table fails to load', async () => {
    vi.mocked(recordsApi.list).mockRejectedValueOnce(
      httpError(HttpStatusCode.InternalServerError),
    );

    renderProvider(<Rows />);

    expect(await screen.findByText('Try again')).toBeTruthy();
    expect(screen.queryByText('Table not available')).toBeNull();

    await act(async () => {
      screen.getByText('Try again').click();
    });

    expect(await screen.findByText('Ada')).toBeTruthy();
  });
});

function renderProvider(children: React.ReactNode): QueryClient {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/tables/t1']}>
        <Routes>
          <Route
            path="/tables/:tableId"
            element={<ApTableStateProvider>{children}</ApTableStateProvider>}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return queryClient;
}

function httpError(status: number): AxiosError {
  return new AxiosError('request failed', String(status), undefined, null, {
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: {},
  });
}

function Rows() {
  const names = useTableState((state) =>
    state.records.map((row) => String(row.values[0]?.value)),
  );
  return <p>{names.join(',')}</p>;
}

const table: Table = {
  id: 't1',
  created: '',
  updated: '',
  name: 'Leads',
  projectId: 'p1',
  externalId: 'e1',
  status: TableAutomationStatus.DISABLED,
  trigger: null,
};

const nameField: Field = {
  id: 'f1',
  created: '',
  updated: '',
  name: 'Name',
  type: FieldType.TEXT,
  tableId: 't1',
  projectId: 'p1',
  externalId: 'x1',
  position: 0,
};

const record: PopulatedRecord = {
  id: 'r1',
  created: '',
  updated: '',
  tableId: 't1',
  projectId: 'p1',
  cells: { f1: { fieldName: 'Name', value: 'Ada', updated: '', created: '' } },
};
