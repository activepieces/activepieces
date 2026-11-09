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
import { act, cleanup, render, screen } from '@testing-library/react';
import { toast } from 'sonner';
import {
  MemoryRouter,
  NavigateFunction,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { followAlong } from '@/features/chat/lib/follow/follow-along';
import { fieldsApi } from '@/features/tables/api/fields-api';
import { recordsApi } from '@/features/tables/api/records-api';
import { tablesApi } from '@/features/tables/api/tables-api';
import {
  ApTableStateProvider,
  useTableState,
} from '@/features/tables/components/ap-table-state-provider';
import { TableState } from '@/features/tables/stores/store/ap-tables-client-state';
import { tableSyncClock } from '@/features/tables/stores/store/table-sync-clock';
import { editorSession } from '@/lib/editor-session';

const socket = vi.hoisted(() => {
  const handlers = new Map<string, (payload?: unknown) => void>();
  const sent: SentEvent[] = [];
  const held = new Map<unknown, () => void>();
  const project = { switching: false };
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
  const emitInProject = ({ key, send }: { key: unknown; send: () => void }) => {
    if (project.switching) {
      held.delete(key);
      held.set(key, send);
      return;
    }
    send();
  };
  const dropHeldEmits = (keys: unknown[]) => {
    keys.forEach((key) => held.delete(key));
  };
  const finishProjectSwitch = () => {
    project.switching = false;
    const sends = [...held.values()];
    held.clear();
    sends.forEach((send) => send());
  };
  const reset = () => {
    handlers.clear();
    sent.splice(0);
    held.clear();
    project.switching = false;
    client.connected = false;
  };
  return {
    client,
    sent,
    project,
    serverSends,
    emitInProject,
    dropHeldEmits,
    finishProjectSwitch,
    reset,
  };
});

vi.mock('@/components/providers/socket-provider', () => ({
  useSocket: () => socket.client,
  emitInProject: socket.emitInProject,
  dropHeldEmits: socket.dropHeldEmits,
}));
vi.mock('@/features/chat/lib/follow/follow-along', () => {
  const followApi = {
    flash: vi.fn(),
    isFollowing: vi.fn((_resource: { kind: string; id: string }) => true),
    flashWhenFollowed: ({
      resource,
      keys,
    }: {
      resource: { kind: string; id: string };
      keys: string[];
    }) => {
      if (followApi.isFollowing(resource)) followApi.flash(keys);
    },
  };
  return {
    followAlong: followApi,
  };
});
vi.mock('@/features/tables/api/records-api', () => ({
  recordsApi: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(async () => {
      throw new Error('offline');
    }),
  },
}));
vi.mock('@/features/tables/api/fields-api', () => ({
  fieldsApi: { list: vi.fn() },
}));
vi.mock('@/features/tables/api/tables-api', () => ({
  tablesApi: { getById: vi.fn() },
}));
vi.mock('@/hooks/use-resource-lock', () => ({
  useResourceLock: () => ({
    lockedBy: null,
    acquiring: false,
    takeOver: vi.fn(),
  }),
}));
vi.mock('@/lib/error-reporting', () => ({
  errorReporting: { report: vi.fn() },
}));
vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { dismiss: vi.fn(), error: vi.fn() }),
}));

describe('open table live events', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(EARLIER);
    socket.reset();
    queryClient = new QueryClient();
    vi.spyOn(queryClient, 'invalidateQueries');
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.mocked(followAlong.flash).mockClear();
    vi.mocked(recordsApi.list).mockClear();
    vi.mocked(recordsApi.getById).mockClear();
    vi.mocked(tablesApi.getById).mockClear();
    vi.mocked(toast).mockClear();
  });

  it('applies created and updated rows from the event without any request', async () => {
    const { rows } = await mount(queryClient);

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
    expect(recordsApi.list).toHaveBeenCalledTimes(1);
    expect(recordsApi.getById).not.toHaveBeenCalled();
    expect(followAlong.flash).toHaveBeenCalledTimes(2);
    expect(followAlong.flash).toHaveBeenLastCalledWith([
      expect.stringMatching(/^table-row:/),
    ]);
  });

  it('removes deleted rows', async () => {
    const { rows } = await mount(queryClient);

    await receive({
      tableId: 't1',
      op: TableRecordsChangeOp.DELETED,
      recordIds: ['r1'],
      editorSessionId: null,
    });

    expect(rows()).toEqual(['b']);
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
  });

  it('refetches the records for a clear instead of emptying the table', async () => {
    const { rows } = await mount(queryClient);

    await receive({
      tableId: 't1',
      op: TableRecordsChangeOp.CLEARED,
      editorSessionId: null,
    });

    expect(rows()).toEqual(['old', 'b']);
    expect(invalidatedKeys(queryClient)).toEqual([['records', 't1']]);
  });

  it('keeps a row this tab is still creating when the table is cleared', async () => {
    const { rows, store } = await mount(queryClient);
    await act(async () => {
      store().createRecord({
        uuid: 'unsaved',
        agentRunId: null,
        values: [{ fieldIndex: 0, value: 'draft' }],
      });
      await settle();
    });

    vi.mocked(recordsApi.list).mockResolvedValue({
      data: [],
      next: null,
      previous: null,
    });

    await receive({
      tableId: 't1',
      op: TableRecordsChangeOp.CLEARED,
      editorSessionId: null,
    });
    await act(settle);

    expect(rows()).toEqual(['draft']);
  });

  it('ignores the echo of this tab’s own edits', async () => {
    const { rows } = await mount(queryClient);

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
    await mount(queryClient);

    await receive({
      tableId: 't1',
      op: TableRecordsChangeOp.RELOAD,
      editorSessionId: null,
    });

    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(invalidatedKeys(queryClient)).toEqual([['records', 't1']]);
  });

  it('fetches once more after a running reload when more reloads arrive', async () => {
    const { rows } = await mount(queryClient);
    const reloading = Promise.withResolvers<void>();
    vi.mocked(recordsApi.list).mockImplementation(async () => {
      await reloading.promise;
      return { data: [record('r1', 'reloaded')], next: null, previous: null };
    });

    await receive({
      tableId: 't1',
      op: TableRecordsChangeOp.RELOAD,
      editorSessionId: null,
    });
    await receive({
      tableId: 't1',
      op: TableRecordsChangeOp.RELOAD,
      editorSessionId: null,
    });
    await act(async () => {
      reloading.resolve();
      await settle();
    });

    expect(recordsApi.list).toHaveBeenCalledTimes(3);
    expect(rows()).toEqual(['reloaded']);
  });

  it('applies a reloaded snapshot and drops rows missing from it', async () => {
    const { rows } = await mount(queryClient);

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
    await mount(queryClient);

    await receive({
      tableId: 't1',
      op: TableRecordsChangeOp.FIELDS_CHANGED,
      editorSessionId: null,
    });

    expect(invalidatedKeys(queryClient)).toEqual([['fields', 't1']]);
  });

  it('refetches the fields when a row names a column it does not know', async () => {
    await mount(queryClient);

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

  it('joins the table room on open and leaves it on close', async () => {
    socket.client.connected = true;
    const { unmount } = await mount(queryClient);

    expect(sentNames()).toEqual([WebsocketServerEvent.JOIN_TABLE_ROOM]);
    expect(socket.sent[0].payload).toEqual({ tableId: 't1' });

    unmount();

    expect(sentNames()).toEqual([
      WebsocketServerEvent.JOIN_TABLE_ROOM,
      WebsocketServerEvent.LEAVE_TABLE_ROOM,
    ]);
    expect(socket.sent[1].payload).toEqual({ tableId: 't1' });
  });

  it('joins only after the project switch is acknowledged', async () => {
    socket.client.connected = true;
    socket.project.switching = true;
    await mount(queryClient);

    expect(sentNames()).toEqual([]);

    act(() => socket.finishProjectSwitch());

    expect(sentNames()).toEqual([WebsocketServerEvent.JOIN_TABLE_ROOM]);
    expect(socket.sent[0].payload).toEqual({ tableId: 't1' });
  });

  it('does not join a table that closed during the project switch', async () => {
    socket.client.connected = true;
    socket.project.switching = true;
    const { unmount } = await mount(queryClient);

    unmount();
    act(() => socket.finishProjectSwitch());

    expect(sentNames()).not.toContain(WebsocketServerEvent.JOIN_TABLE_ROOM);
  });

  it('joins the room again after the socket reconnects', async () => {
    socket.client.connected = true;
    await mount(queryClient);

    socket.serverSends('connect');

    expect(sentNames()).toEqual([
      WebsocketServerEvent.JOIN_TABLE_ROOM,
      WebsocketServerEvent.JOIN_TABLE_ROOM,
    ]);
  });

  it('loads the table only after the room is joined', async () => {
    socket.client.connected = true;
    await mount(queryClient);
    expect(sentNames()).toEqual([WebsocketServerEvent.JOIN_TABLE_ROOM]);
    expect(tablesApi.getById).not.toHaveBeenCalled();

    await act(async () => {
      socket.sent[0].ack?.(null, { joined: true });
      await settle();
    });

    expect(tablesApi.getById).toHaveBeenCalledTimes(1);
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
  });

  it('refetches once when the table loaded before the join was sent', async () => {
    await mount(queryClient);
    vi.setSystemTime(LATER);

    socket.serverSends('connect');
    expect(sentNames()).toEqual([WebsocketServerEvent.JOIN_TABLE_ROOM]);
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();

    act(() => socket.sent[0].ack?.(null, { joined: true }));

    expect(invalidatedKeys(queryClient)).toEqual([
      ['table', 't1'],
      ['fields', 't1'],
      ['records', 't1'],
    ]);
  });

  it('still loads the table when the join is not answered', async () => {
    socket.client.connected = true;
    await mount(queryClient);

    await act(async () => {
      socket.sent[0].ack?.(new Error('timeout'));
      await settle();
    });

    expect(tablesApi.getById).toHaveBeenCalledTimes(1);
  });

  it('starts loading the table only once the room is joined', async () => {
    socket.client.connected = true;
    socket.project.switching = true;
    await mount(queryClient);

    await act(async () => {
      socket.finishProjectSwitch();
      await settle();
    });

    expect(sentNames()).toEqual([WebsocketServerEvent.JOIN_TABLE_ROOM]);
    expect(tablesApi.getById).not.toHaveBeenCalled();

    await act(async () => {
      socket.sent[0].ack?.(null, { joined: true });
      await settle();
    });

    expect(tablesApi.getById).toHaveBeenCalledTimes(1);
  });

  it('does not refetch when the server refuses the room', async () => {
    await mount(queryClient);
    vi.setSystemTime(LATER);

    socket.serverSends('connect');
    act(() => socket.sent[0].ack?.(null, { joined: false }));

    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
  });

  it('stops editing and says so when the table is deleted', async () => {
    const { rows } = await mount(queryClient);
    expect(rows()).toEqual(['old', 'b']);

    await receive({
      tableId: 't1',
      op: TableRecordsChangeOp.TABLE_DELETED,
      editorSessionId: null,
    });

    expect(screen.getByText('This table was deleted')).toBeTruthy();
    expect(screen.queryByTestId('table-probe')).toBeNull();
  });

  it('refetches the table when it is renamed', async () => {
    await mount(queryClient);

    await receive({
      tableId: 't1',
      op: TableRecordsChangeOp.TABLE_UPDATED,
      editorSessionId: null,
    });

    expect(invalidatedKeys(queryClient)).toEqual([['table', 't1']]);
  });

  it('ignores a change it can not read', async () => {
    const { rows } = await mount(queryClient);

    await act(async () => {
      socket.serverSends(WebsocketClientEvent.TABLE_RECORDS_CHANGED, {
        tableId: 't1',
        op: 'SOMETHING_NEW',
        editorSessionId: null,
      });
      await settle();
    });

    expect(rows()).toEqual(['old', 'b']);
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
  });

  it('says live updates are delayed when the server refuses the room', async () => {
    socket.client.connected = true;
    await mount(queryClient);

    act(() => socket.sent[0].ack?.(null, { joined: false }));

    expect(toast).toHaveBeenCalledWith(
      'Live updates are delayed',
      expect.objectContaining({ id: 'table-live-updates' }),
    );
  });

  it('says live updates are delayed when the join is not answered', async () => {
    socket.client.connected = true;
    await mount(queryClient);

    act(() => socket.sent[0].ack?.(new Error('timeout')));

    expect(toast).toHaveBeenCalledWith(
      'Live updates are delayed',
      expect.objectContaining({ id: 'table-live-updates' }),
    );
  });

  it('refetches when the table fetch started before the join was sent, even if it finished after', async () => {
    await mount(queryClient, {
      whileLoading: () => {
        vi.setSystemTime(MIDDLE);
        socket.client.connected = true;
        socket.serverSends('connect');
        vi.setSystemTime(LATER);
      },
    });
    expect(sentNames()).toEqual([WebsocketServerEvent.JOIN_TABLE_ROOM]);

    act(() => socket.sent[0].ack?.(null, { joined: true }));

    expect(invalidatedKeys(queryClient)).toEqual([
      ['table', 't1'],
      ['fields', 't1'],
      ['records', 't1'],
    ]);
  });

  it('applies a change that arrives while the table loads', async () => {
    const { rows } = await mount(queryClient, {
      whileLoading: () =>
        socket.serverSends(WebsocketClientEvent.TABLE_RECORDS_CHANGED, {
          tableId: 't1',
          op: TableRecordsChangeOp.CREATED,
          records: [record('r3', 'during load')],
          editorSessionId: null,
        }),
    });
    await act(settle);

    expect(rows()).toEqual(['old', 'b', 'during load']);
  });

  it('does not apply a change for the previous table to the next one', async () => {
    const loading = Promise.withResolvers<void>();
    vi.mocked(tablesApi.getById).mockImplementation(async () => {
      await loading.promise;
      return table;
    });
    vi.mocked(fieldsApi.list).mockImplementation(async () => {
      await loading.promise;
      return [nameField];
    });
    vi.mocked(recordsApi.list).mockImplementation(async () => {
      await loading.promise;
      return { data: [record('r1', 'old')], next: null, previous: null };
    });
    let rows: unknown[] = [];
    let navigate: NavigateFunction | null = null;
    function Probe() {
      rows = useTableState((current) =>
        current.records.map((row) => row.values[0]?.value),
      );
      return <span data-testid="table-probe" />;
    }
    function Navigator() {
      navigate = useNavigate();
      return null;
    }
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/tables/t1']}>
          <Navigator />
          <Routes>
            <Route
              path="/tables/:tableId"
              element={
                <ApTableStateProvider>
                  <Probe />
                </ApTableStateProvider>
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    socket.serverSends(WebsocketClientEvent.TABLE_RECORDS_CHANGED, {
      tableId: 't1',
      op: TableRecordsChangeOp.CREATED,
      records: [record('r3', 'from the first table')],
      editorSessionId: null,
    });
    act(() => {
      void navigate?.('/tables/t2');
    });
    loading.resolve();
    for (
      let attempt = 0;
      attempt < 20 && screen.queryByTestId('table-probe') === null;
      attempt += 1
    ) {
      await act(settle);
    }
    await act(settle);

    expect(rows).toEqual(['old']);
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

async function mount(
  queryClient: QueryClient,
  {
    whileLoading = () => undefined,
    onFetchStart = () => undefined,
  }: { whileLoading?: () => void; onFetchStart?: () => void } = {},
) {
  const loading = Promise.withResolvers<void>();
  vi.mocked(tablesApi.getById).mockImplementation(async () => {
    onFetchStart();
    await loading.promise;
    return table;
  });
  vi.mocked(fieldsApi.list).mockImplementation(async () => {
    await loading.promise;
    return [nameField];
  });
  vi.mocked(recordsApi.list).mockImplementation(async () => {
    await loading.promise;
    return {
      data: [record('r1', 'old'), record('r2', 'b')],
      next: null,
      previous: null,
    };
  });
  let rows: unknown[] = [];
  let state: TableState | null = null;
  function Probe() {
    rows = useTableState((current) =>
      current.records.map((row) => row.values[0]?.value),
    );
    state = useTableState((current) => current);
    return <span data-testid="table-probe" />;
  }
  const { unmount } = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/tables/t1']}>
        <Routes>
          <Route
            path="/tables/:tableId"
            element={
              <ApTableStateProvider>
                <Probe />
              </ApTableStateProvider>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  whileLoading();
  loading.resolve();
  for (let attempt = 0; attempt < 20 && state === null; attempt += 1) {
    await act(settle);
  }
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

const EARLIER = new Date('2026-01-01T00:00:00.000Z');
const MIDDLE = new Date('2026-01-01T00:00:02.000Z');
const LATER = new Date('2026-01-01T00:00:05.000Z');

type Ack = (error: Error | null, response?: unknown) => void;

type SentEvent = { name: string; payload: unknown; ack?: Ack };
