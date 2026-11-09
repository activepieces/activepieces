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
  WebsocketServerEvent,
} from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { followAlong } from '@/features/chat/lib/follow/follow-along';
import { recordsApi } from '@/features/tables/api/records-api';
import {
  TableStateProviderWithTable,
  useTableState,
} from '@/features/tables/components/ap-table-state-provider';
import { TableState } from '@/features/tables/stores/store/ap-tables-client-state';
import { tableSyncClock } from '@/features/tables/stores/store/table-sync-clock';
import { editorSession } from '@/lib/editor-session';

const socket = vi.hoisted(() => {
  const handlers = new Map<string, (payload?: unknown) => void>();
  const sent: SentEvent[] = [];
  const client = {
    connected: false,
    on: (name: string, handler: (payload?: unknown) => void) =>
      handlers.set(name, handler),
    off: (name: string) => handlers.delete(name),
    emit: (name: string, payload: unknown, ack?: Ack) =>
      sent.push({ name, payload, ack }),
    timeout: () => client,
  };
  const serverSends = (name: string, payload?: unknown) =>
    handlers.get(name)?.(payload);
  const reset = () => {
    handlers.clear();
    sent.splice(0);
    client.connected = false;
  };
  return { client, sent, serverSends, reset };
});

vi.mock('@/components/providers/socket-provider', () => ({
  useSocket: () => socket.client,
}));
vi.mock('@/features/chat/lib/follow/follow-along', () => ({
  followAlong: { flash: vi.fn(), isFollowing: vi.fn(() => true) },
}));
vi.mock('@/features/tables/api/records-api', () => ({
  recordsApi: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(async () => {
      throw new Error('offline');
    }),
  },
}));
vi.mock('@/features/tables/api/fields-api', () => ({ fieldsApi: {} }));
vi.mock('@/features/tables/api/tables-api', () => ({ tablesApi: {} }));
vi.mock('@/lib/error-reporting', () => ({
  errorReporting: { report: vi.fn() },
}));

describe('open table live events', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    socket.reset();
    queryClient = new QueryClient();
    vi.spyOn(queryClient, 'invalidateQueries');
  });

  afterEach(() => {
    cleanup();
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
      editorSessionId: null,
    });
    await receive({
      tableId: 't1',
      op: TableRecordsChangeOp.CREATED,
      records: [record('r3', 'c')],
      editorSessionId: null,
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
      editorSessionId: null,
    });
    expect(rows()).toEqual(['b']);

    await receive({
      tableId: 't1',
      op: TableRecordsChangeOp.CLEARED,
      editorSessionId: null,
    });
    expect(rows()).toEqual([]);
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
  });

  it('empties the whole table on a clear, rows that never saved included', async () => {
    const { rows, store } = mount(queryClient);
    await act(async () => {
      store().createRecord({
        uuid: 'unsaved',
        agentRunId: null,
        values: [{ fieldIndex: 0, value: 'draft' }],
      });
      await settle();
    });
    expect(rows()).toEqual(['old', 'b', 'draft']);

    await receive({
      tableId: 't1',
      op: TableRecordsChangeOp.CLEARED,
      editorSessionId: null,
    });

    expect(rows()).toEqual([]);
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

    await receive({
      tableId: 't1',
      op: TableRecordsChangeOp.RELOAD,
      editorSessionId: null,
    });

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

  it('refetches the fields when the chat changes the columns', async () => {
    mount(queryClient);

    await receive({
      tableId: 't1',
      op: TableRecordsChangeOp.FIELDS_CHANGED,
      editorSessionId: null,
    });

    expect(invalidatedKeys(queryClient)).toEqual([['fields', 't1']]);
  });

  it('refetches the fields when a row names a column it does not know', async () => {
    mount(queryClient);

    await receive({
      tableId: 't1',
      op: TableRecordsChangeOp.UPDATED,
      records: [
        {
          ...record('r1', 'new'),
          cells: {
            ...record('r1', 'new').cells,
            f2: { fieldName: 'Email', value: 'a@b.c', updated: '', created: '' },
          },
        },
      ],
      editorSessionId: null,
    });

    expect(invalidatedKeys(queryClient)).toEqual([['fields', 't1']]);
  });

  it('joins the table room on open and leaves it on close', () => {
    socket.client.connected = true;
    const { unmount } = mount(queryClient);

    expect(sentNames()).toEqual([WebsocketServerEvent.JOIN_TABLE]);
    expect(socket.sent[0].payload).toEqual({ tableId: 't1' });

    unmount();

    expect(sentNames()).toEqual([
      WebsocketServerEvent.JOIN_TABLE,
      WebsocketServerEvent.LEAVE_TABLE,
    ]);
    expect(socket.sent[1].payload).toEqual({ tableId: 't1' });
  });

  it('refetches the table once the room is joined, so changes made while it loaded are not lost', () => {
    socket.client.connected = true;
    mount(queryClient);
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();

    act(() => socket.sent[0].ack?.(null));

    expect(invalidatedKeys(queryClient)).toEqual([
      ['table', 't1'],
      ['fields', 't1'],
      ['records', 't1'],
    ]);
  });

  it('rejoins the room after a reconnect and refetches only after the join is acknowledged', () => {
    mount(queryClient);

    socket.serverSends('connect');
    expect(sentNames()).toEqual([WebsocketServerEvent.JOIN_TABLE]);
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();

    act(() => socket.sent[0].ack?.(null));

    expect(invalidatedKeys(queryClient)).toEqual([
      ['table', 't1'],
      ['fields', 't1'],
      ['records', 't1'],
    ]);
  });
});

function sentNames(): string[] {
  return socket.sent.map(({ name }) => name);
}

function invalidatedKeys(queryClient: QueryClient): unknown[] {
  return vi
    .mocked(queryClient.invalidateQueries)
    .mock.calls.map(([filters]) => filters?.queryKey);
}

async function receive(event: TableRecordsChangedEvent) {
  await act(async () => {
    socket.serverSends(WebsocketClientEvent.TABLE_RECORDS_CHANGED, event);
    await settle();
  });
}

function settle() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function mount(queryClient: QueryClient) {
  let rows: unknown[] = [];
  let state: TableState | null = null;
  function Probe() {
    rows = useTableState((current) =>
      current.records.map((row) => row.values[0]?.value),
    );
    state = useTableState((current) => current);
    return null;
  }
  const { unmount } = render(
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
  return {
    unmount,
    rows: () => rows,
    store: () => {
      if (state === null) throw new Error('table not mounted');
      return state;
    },
  };
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

type Ack = (error: Error | null, response?: unknown) => void;

type SentEvent = { name: string; payload: unknown; ack?: Ack };
