/**
 * @vitest-environment jsdom
 */
import {
  Field,
  FieldType,
  PopulatedRecord,
  Table,
  TableAutomationStatus,
  TableRecordsChangedEvent,
  TableRecordsChangeOp,
  WebsocketClientEvent,
} from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { followAlong } from '@/features/chat/lib/follow/follow-along';
import { recordsApi } from '@/features/tables/api/records-api';
import {
  TableStateProviderWithTable,
  useTableState,
} from '@/features/tables/components/ap-table-state-provider';
import { tableSyncClock } from '@/features/tables/stores/store/table-sync-clock';
import { editorSession } from '@/lib/editor-session';

const socket = vi.hoisted(() => {
  const handlers = new Map<string, (payload?: unknown) => void>();
  return {
    handlers,
    on: (name: string, handler: (payload?: unknown) => void) =>
      handlers.set(name, handler),
    off: (name: string) => handlers.delete(name),
    emit: (name: string, payload?: unknown) => handlers.get(name)?.(payload),
  };
});

vi.mock('@/components/providers/socket-provider', () => ({
  useSocket: () => socket,
}));
vi.mock('@/features/chat/lib/follow/follow-along', () => ({
  followAlong: { flash: vi.fn(), isFollowing: vi.fn(() => true) },
}));
vi.mock('@/features/tables/api/records-api', () => ({
  recordsApi: { list: vi.fn(), getById: vi.fn() },
}));
vi.mock('@/features/tables/api/fields-api', () => ({ fieldsApi: {} }));
vi.mock('@/features/tables/api/tables-api', () => ({ tablesApi: {} }));
vi.mock('@/lib/error-reporting', () => ({ errorReporting: {} }));

describe('open table live events', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
    vi.spyOn(queryClient, 'invalidateQueries');
  });

  afterEach(() => {
    vi.mocked(followAlong.flash).mockClear();
    vi.mocked(recordsApi.list).mockClear();
    vi.mocked(recordsApi.getById).mockClear();
  });

  it('applies created and updated rows from the event without any request', async () => {
    const { rows } = mount(queryClient);

    await receive({
      tableId: 't1',
      op: TableRecordsChangeOp.UPDATED,
      records: [record('r1', 'new')],
    });
    await receive({
      tableId: 't1',
      op: TableRecordsChangeOp.CREATED,
      records: [record('r3', 'c')],
    });

    expect(rows()).toEqual(['new', 'b', 'c']);
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
    expect(recordsApi.list).not.toHaveBeenCalled();
    expect(recordsApi.getById).not.toHaveBeenCalled();
    expect(followAlong.flash).toHaveBeenCalledTimes(2);
    expect(followAlong.flash).toHaveBeenLastCalledWith([
      expect.stringMatching(/^table-row:/),
    ]);
  });

  it('removes deleted rows and empties a cleared table', async () => {
    const { rows } = mount(queryClient);

    await receive({
      tableId: 't1',
      op: TableRecordsChangeOp.DELETED,
      recordIds: ['r1'],
    });
    expect(rows()).toEqual(['b']);

    await receive({ tableId: 't1', op: TableRecordsChangeOp.CLEARED });
    expect(rows()).toEqual([]);
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
  });

  it('ignores the echo of this tab’s own edits', async () => {
    const { rows } = mount(queryClient);

    await receive({
      tableId: 't1',
      op: TableRecordsChangeOp.UPDATED,
      records: [record('r1', 'echo')],
      editorSessionId: editorSession.getId(),
    });

    expect(rows()).toEqual(['old', 'b']);
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
  });

  it('refetches the records once for a reload', async () => {
    mount(queryClient);

    await receive({ tableId: 't1', op: TableRecordsChangeOp.RELOAD });

    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['records', 't1'],
    });
  });

  it('applies a reloaded snapshot and drops rows missing from it', async () => {
    const { rows } = mount(queryClient);

    await act(async () => {
      queryClient.setQueryData(['records', 't1'], {
        data: [record('r1', 'reloaded')],
        since: tableSyncClock.tick(),
      });
      await settle();
    });

    expect(rows()).toEqual(['reloaded']);
  });

  it('refreshes the open table once after the socket reconnects', () => {
    mount(queryClient);
    socket.emit('connect');
    expect(
      vi
        .mocked(queryClient.invalidateQueries)
        .mock.calls.map(([filters]) => filters?.queryKey),
    ).toEqual([
      ['table', 't1'],
      ['fields', 't1'],
      ['records', 't1'],
    ]);
  });
});

async function receive(event: TableRecordsChangedEvent) {
  await act(async () => {
    socket.emit(WebsocketClientEvent.TABLE_RECORDS_CHANGED, event);
    await settle();
  });
}

function settle() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function mount(queryClient: QueryClient) {
  let rows: unknown[] = [];
  function Probe() {
    rows = useTableState((state) =>
      state.records.map((row) => row.values[0]?.value),
    );
    return null;
  }
  render(
    <QueryClientProvider client={queryClient}>
      <TableStateProviderWithTable
        table={table}
        fields={[nameField]}
        records={[record('r1', 'old'), record('r2', 'b')]}
      >
        <Probe />
      </TableStateProviderWithTable>
    </QueryClientProvider>,
  );
  return { rows: () => rows };
}

function record(id: string, value: string): PopulatedRecord {
  return {
    id,
    created: '',
    updated: '',
    tableId: 't1',
    projectId: 'p1',
    cells: { f1: { fieldName: 'Name', value, updated: '', created: '' } },
  };
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
