import { isNil } from '@activepieces/core-utils';
import { Field, Table, PopulatedRecord } from '@activepieces/shared';
import {
  QueryClient,
  QueryKey,
  hashKey,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { HttpStatusCode } from 'axios';
import { t } from 'i18next';
import { FileX } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStore } from 'zustand';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { RouteLoadingBar } from '@/components/custom/route-loading-bar';
import { buttonVariants } from '@/components/ui/button';
import { followAlong } from '@/features/chat/lib/follow/follow-along';
import {
  TableState,
  ApTableStore,
  createApTableStore,
} from '@/features/tables/stores/store/ap-tables-client-state';
import { tableSyncClock } from '@/features/tables/stores/store/table-sync-clock';
import { useResourceLock } from '@/hooks/use-resource-lock';
import { api } from '@/lib/api';
import { PromiseQueue } from '@/lib/promise-queue';
import { cn } from '@/lib/utils';

import { fieldsApi } from '../api/fields-api';
import { recordsApi } from '../api/records-api';
import { tablesApi } from '../api/tables-api';
import { TableChange, useTableRoom } from '../hooks/use-table-room';
import { tableQueryKeys } from '../utils/table-query-keys';

const TableContext = createContext<ApTableStore | null>(null);
const TableRefreshContext = createContext<(() => Promise<void>) | null>(null);
const TableLockContext = createContext<TableLockContextValue | null>(null);

export const TableStateProviderWithTable = ({
  children,
  table,
  fields,
  records,
  changes,
}: {
  children: React.ReactNode;
  table: Table;
  fields: Field[];
  records: PopulatedRecord[];
  changes: TableChangeFeed;
}) => {
  const [tableStore] = useState(() =>
    createApTableStore(table, fields, records),
  );
  useServerSync({ tableId: table.id, store: tableStore, changes });
  return (
    <TableContext.Provider value={tableStore}>{children}</TableContext.Provider>
  );
};

export function ApTableStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const tableId = useParams().tableId;
  return (
    <RouteTableStateProvider key={tableId} tableId={tableId}>
      {children}
    </RouteTableStateProvider>
  );
}

function RouteTableStateProvider({
  tableId,
  children,
}: {
  tableId: string | undefined;
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const [refreshKey, setRefreshKey] = useState(0);
  const [changes] = useState(createChangeFeed);
  const [deleted, setDeleted] = useState(false);
  const onChange = useCallback(
    (change: TableChange) => {
      if (change.type === 'deleted') {
        setDeleted(true);
        return;
      }
      if (change.type === 'reload') {
        queryClient
          .invalidateQueries(
            { queryKey: reloadKeyOf({ scope: change.scope, tableId }) },
            { cancelRefetch: false },
          )
          .catch(() => undefined);
        return;
      }
      changes.push({ change, since: tableSyncClock.tick() });
    },
    [queryClient, tableId, changes],
  );
  const refetchMissed = useCallback(
    ({ sentAt }: { sentAt: number }) => {
      syncedKeys(tableId)
        .filter(
          (queryKey) =>
            (queryClient.getQueryData<Snapshot<unknown>>(queryKey)
              ?.fetchStartedAt ?? 0) < sentAt,
        )
        .forEach((queryKey) =>
          queryClient.invalidateQueries({ queryKey }).catch(() => undefined),
        );
    },
    [queryClient, tableId],
  );
  const room = useTableRoom({ tableId, onChange, onJoined: refetchMissed });
  const {
    data: table,
    isLoading: isTableLoading,
    error: tableError,
  } = useQuery({
    queryKey: tableQueryKeys.table(tableId),
    queryFn: () => snapshotOf(() => tablesApi.getById(tableId!)),
    enabled: room.ready,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0,
  });

  const {
    data: fields,
    isLoading: isFieldsLoading,
    error: fieldsError,
  } = useQuery({
    queryKey: tableQueryKeys.fields(tableId),
    queryFn: () => snapshotOf(() => fieldsApi.list({ tableId: tableId! })),
    enabled: room.ready,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0,
  });

  const {
    data: records,
    isLoading: isRecordsLoading,
    error: recordsError,
  } = useQuery({
    queryKey: tableQueryKeys.records(tableId),
    queryFn: () =>
      snapshotOf(() =>
        recordsApi
          .list({ tableId: tableId!, limit: 99999999, cursor: undefined })
          .then((page) => page.data),
      ),
    enabled: room.ready,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0,
  });

  // rebuilds the table store from freshly fetched server state without
  // reloading the document (a full reload breaks the embed SDK handshake
  // inside an iframe)
  const refreshTableState = useCallback(async () => {
    await Promise.all([
      queryClient.refetchQueries({ queryKey: tableQueryKeys.table(tableId) }),
      queryClient.refetchQueries({
        queryKey: tableQueryKeys.fields(tableId),
      }),
      queryClient.refetchQueries({
        queryKey: tableQueryKeys.records(tableId),
      }),
    ]);
    setRefreshKey((key) => key + 1);
  }, [queryClient, tableId]);

  if (!room.ready || isTableLoading || isFieldsLoading || isRecordsLoading) {
    return <RouteLoadingBar />;
  }

  if (deleted) {
    return <TableUnavailable title={t('This table was deleted')} />;
  }

  if ([tableError, fieldsError, recordsError].some(isNotFoundError)) {
    return <TableUnavailable title={t('Table not available')} />;
  }

  if (isNil(table) || isNil(fields) || isNil(records)) {
    return (
      <DataFetchErrorState
        entity={t('table')}
        onRetry={refreshTableState}
        className="h-full"
      />
    );
  }

  return (
    <TableRefreshContext.Provider value={refreshTableState}>
      <TableLockProvider
        resourceId={table.data.id}
        onTakeOver={refreshTableState}
      >
        <TableStateProviderWithTable
          key={refreshKey}
          table={table.data}
          fields={fields.data}
          records={records.data}
          changes={changes}
        >
          {children}
        </TableStateProviderWithTable>
      </TableLockProvider>
    </TableRefreshContext.Provider>
  );
}

function useServerSync({
  tableId,
  store,
  changes,
}: {
  tableId: string;
  store: ApTableStore;
  changes: TableChangeFeed;
}) {
  const queryClient = useQueryClient();
  const [applies] = useState(() => new PromiseQueue());
  useEffect(() => {
    const stopFollowingQueries = queryClient
      .getQueryCache()
      .subscribe((event) => {
        if (event.type !== 'updated' || event.action.type !== 'success') {
          return;
        }
        const { queryHash } = event.query;
        const ours = syncedKeys(tableId).some(
          (queryKey) => hashKey(queryKey) === queryHash,
        );
        if (!ours) return;
        applies.add(() =>
          applySnapshot({ queryHash, tableId, store, queryClient }),
        );
      });
    const stopFollowingChanges = changes.attach(({ change, since }) =>
      applies.add(() =>
        applyChange({ change, since, tableId, store, queryClient }),
      ),
    );
    return () => {
      stopFollowingQueries();
      stopFollowingChanges();
    };
  }, [queryClient, store, tableId, applies, changes]);
}

function createChangeFeed() {
  let pending: TimedChange[] = [];
  let consumer: ((timed: TimedChange) => void) | null = null;
  return {
    push: (timed: TimedChange) => {
      if (consumer === null) {
        pending = [...pending, timed];
        return;
      }
      consumer(timed);
    },
    attach: (next: (timed: TimedChange) => void) => {
      consumer = next;
      const queued = pending;
      pending = [];
      queued.forEach(next);
      return () => {
        if (consumer === next) {
          consumer = null;
        }
      };
    },
  };
}

async function applySnapshot({
  queryHash,
  tableId,
  store,
  queryClient,
}: {
  queryHash: string;
  tableId: string;
  store: ApTableStore;
  queryClient: QueryClient;
}) {
  const tableKey = tableQueryKeys.table(tableId);
  const fieldsKey = tableQueryKeys.fields(tableId);
  const recordsKey = tableQueryKeys.records(tableId);
  await store.getState().waitForSaves();
  const state = store.getState();
  const table =
    queryHash === hashKey(tableKey)
      ? queryClient.getQueryData<Snapshot<Table>>(tableKey)
      : undefined;
  if (table) {
    state.applyServerTable({ table: table.data, since: table.since });
  }
  const fields =
    queryHash === hashKey(fieldsKey)
      ? queryClient.getQueryData<Snapshot<Field[]>>(fieldsKey)
      : undefined;
  if (fields) {
    state.applyServerFields({ fields: fields.data, since: fields.since });
  }
  const records =
    queryHash === hashKey(recordsKey)
      ? queryClient.getQueryData<Snapshot<PopulatedRecord[]>>(recordsKey)
      : undefined;
  if (records) {
    state.applyServerRecords({ records: records.data, since: records.since });
  }
}

async function applyChange({
  change,
  since,
  tableId,
  store,
  queryClient,
}: {
  change: LiveChange;
  since: number;
  tableId: string;
  store: ApTableStore;
  queryClient: QueryClient;
}) {
  await store.getState().waitForSaves();
  const state = store.getState();
  const knownFieldIds = new Set(state.serverFields.map((field) => field.id));
  const hasUnknownField = change.records.some((record) =>
    Object.keys(record.cells).some((fieldId) => !knownFieldIds.has(fieldId)),
  );
  if (hasUnknownField) {
    queryClient
      .invalidateQueries({ queryKey: tableQueryKeys.fields(tableId) })
      .catch(() => undefined);
  }
  const rowIds = state.applyRecordChanges({
    records: change.records,
    removedIds: change.removedIds,
    since,
  });
  if (followAlong.isFollowing({ kind: 'table', id: tableId })) {
    followAlong.flash(
      [...rowIds.values()].map((rowId) => `table-row:${rowId}`),
    );
  }
}

function TableUnavailable({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
      <div className="rounded-full bg-gray-3 p-4">
        <FileX className="h-10 w-10 text-gray-11" />
      </div>

      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-gray-11">
          {t(
            'We couldn’t load this table. It may have been removed or is unavailable.',
          )}
        </p>
      </div>

      <Link className={cn(buttonVariants({ variant: 'outline' }))} to="/tables">
        {t('Go to Tables')}
      </Link>
    </div>
  );
}

function isNotFoundError(error: Error | null): boolean {
  return (
    api.isError(error) && error.response?.status === HttpStatusCode.NotFound
  );
}

function reloadKeyOf({
  scope,
  tableId,
}: {
  scope: ReloadScope;
  tableId: string | undefined;
}): QueryKey {
  switch (scope) {
    case 'table':
      return tableQueryKeys.table(tableId);
    case 'fields':
      return tableQueryKeys.fields(tableId);
    case 'records':
      return tableQueryKeys.records(tableId);
  }
}

function syncedKeys(tableId: string | undefined): QueryKey[] {
  return [
    tableQueryKeys.table(tableId),
    tableQueryKeys.fields(tableId),
    tableQueryKeys.records(tableId),
  ];
}

async function snapshotOf<T>(fetch: () => Promise<T>): Promise<Snapshot<T>> {
  const since = tableSyncClock.tick();
  const fetchStartedAt = Date.now();
  return { data: await fetch(), since, fetchStartedAt };
}

export function useTableState<T>(selector: (state: TableState) => T) {
  const tableStore = useContext(TableContext);
  if (!tableStore) {
    throw new Error('Table context not found');
  }
  return useStore(tableStore, selector);
}

export function useRefreshTableState() {
  const refreshTableState = useContext(TableRefreshContext);
  if (!refreshTableState) {
    throw new Error('Table refresh context not found');
  }
  return refreshTableState;
}

export function useTableLock() {
  const lock = useContext(TableLockContext);
  if (!lock) {
    throw new Error('Table lock context not found');
  }
  return lock;
}

export function useOptionalTableStore() {
  const tableStore = useContext(TableContext);
  return tableStore ?? null;
}

// mounted above the keyed remount of TableStateProviderWithTable so a
// take-over refresh never unmounts the lock hook — unmounting it would emit
// a spurious UNLOCK_RESOURCE/LOCK_RESOURCE pair and briefly release the
// just-acquired lock for other clients
function TableLockProvider({
  resourceId,
  onTakeOver,
  children,
}: {
  resourceId: string;
  onTakeOver: () => void | Promise<void>;
  children: React.ReactNode;
}) {
  const { lockedBy, acquiring, takeOver } = useResourceLock({
    resourceId,
    onTakeOver,
  });
  const lock = useMemo(
    () => ({ lockedBy, acquiring, takeOver }),
    [lockedBy, acquiring, takeOver],
  );
  return (
    <TableLockContext.Provider value={lock}>
      {children}
    </TableLockContext.Provider>
  );
}

type TableLockContextValue = ReturnType<typeof useResourceLock>;

type Snapshot<T> = { data: T; since: number; fetchStartedAt?: number };

type ReloadScope = Extract<TableChange, { type: 'reload' }>['scope'];

type LiveChange = Exclude<
  TableChange,
  { type: 'reload' } | { type: 'deleted' }
>;

type TimedChange = {
  change: LiveChange;
  since: number;
};

type TableChangeFeed = ReturnType<typeof createChangeFeed>;
