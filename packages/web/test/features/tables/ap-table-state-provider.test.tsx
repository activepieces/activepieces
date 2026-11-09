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
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fieldsApi } from '@/features/tables/api/fields-api';
import { recordsApi } from '@/features/tables/api/records-api';
import { tablesApi } from '@/features/tables/api/tables-api';
import {
  ApTableStateProvider,
  useTableState,
} from '@/features/tables/components/ap-table-state-provider';

vi.mock('@/components/providers/socket-provider', () => ({
  useSocket: () => ({ connected: false, on: vi.fn(), off: vi.fn() }),
}));
vi.mock('@/hooks/use-resource-lock', () => ({
  useResourceLock: () => ({
    lockedBy: null,
    acquiring: false,
    takeOver: vi.fn(),
  }),
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
vi.mock('@/lib/error-reporting', () => ({
  errorReporting: { report: vi.fn() },
}));

describe('ApTableStateProvider', () => {
  afterEach(() => {
    cleanup();
  });

  it('keeps an open table on screen when a background refetch fails', async () => {
    vi.mocked(tablesApi.getById).mockResolvedValue(table);
    vi.mocked(fieldsApi.list).mockResolvedValue([nameField]);
    vi.mocked(recordsApi.list).mockResolvedValue({
      data: [record],
      next: null,
      previous: null,
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/tables/t1']}>
          <Routes>
            <Route
              path="/tables/:tableId"
              element={
                <ApTableStateProvider>
                  <Rows />
                </ApTableStateProvider>
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByText('Ada')).toBeTruthy();

    vi.mocked(recordsApi.list).mockRejectedValue(new Error('offline'));
    await act(async () => {
      await queryClient.refetchQueries({ queryKey: ['records', 't1'] });
    });

    expect(screen.getByText('Ada')).toBeTruthy();
    expect(screen.queryByText('Table not available')).toBeNull();
  });
});

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
