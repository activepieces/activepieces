import { isNil } from '@activepieces/core-utils';
import { Field, Table, PopulatedRecord } from '@activepieces/shared';
import {
  QueryClient,
  QueryKey,
  hashKey,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { t } from 'i18next';
import { FileX } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStore } from 'zustand';

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
}: {
  children: React.ReactNode;
  table: Table;
  fields: Field[];
  records: PopulatedRecord[];
}) => {
  const tableStoreRef = useRef<ApTableStore>(
    createApTableStore(table, fields, records),
  );
  useServerSync({ tableId: table.id, store: tableStoreRef.current });
  return (
    <TableContext.Provider value={tableStoreRef.current}>
      {children}
    </TableContext.Provider>
  );
};

export function ApTableStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const tableId = useParams().tableId;
  const queryClient = useQueryClient();
  const [refreshKey, setRefreshKey] = useState(0);
  const { data: table, isLoading: isTableLoading } = useQuery({
    queryKey: tableQueryKeys.table(tableId),
    queryFn: () => snapshotOf(() => tablesApi.getById(tableId!)),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: fields, isLoading: isFieldsLoading } = useQuery({
    queryKey: tableQueryKeys.fields(tableId),
    queryFn: () => snapshotOf(() => fieldsApi.list({ tableId: tableId! })),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: records, isLoading: isRecordsLoading } = useQuery({
    queryKey: tableQueryKeys.records(tableId),
    queryFn: () =>
      snapshotOf(() =>
        recordsApi
          .list({ tableId: tableId!, limit: 99999999, cursor: undefined })
          .then((page) => page.data),
      ),
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

  if (isTableLoading || isFieldsLoading || isRecordsLoading) {
    return <RouteLoadingBar />;
  }

  if (isNil(table) || isNil(fields) || isNil(records)) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
        <div className="rounded-full bg-gray-3 p-4">
          <FileX className="h-10 w-10 text-gray-11" />
        </div>

        <div>
          <h2 className="text-lg font-semibold">{t('Table not available')}</h2>
          <p className="text-sm text-gray-11">
            {t(
              'We couldn’t load this table. It may have been removed or is unavailable.',
            )}
          </p>
        </div>

        <Link
          className={cn(buttonVariants({ variant: 'outline' }))}
          to="/tables"
        >
          {t('Go to Tables')}
        </Link>
      </div>
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
}: {
  tableId: string;
  store: ApTableStore;
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
    return stopFollowingQueries;
  }, [queryClient, store, tableId, applies]);
  const refetchTable = useCallback(() => {
    syncedKeys(tableId).forEach((queryKey) =>
      queryClient.invalidateQueries({ queryKey }),
    );
  }, [queryClient, tableId]);
  const onChange = useCallback(
    (change: TableChange) => {
      if (change.type === 'reload') {
        const queryKey =
          change.scope === 'fields'
            ? tableQueryKeys.fields(tableId)
            : tableQueryKeys.records(tableId);
        queryClient.invalidateQueries({ queryKey });
        return;
      }
      const since = tableSyncClock.tick();
      applies.add(() =>
        applyChange({ change, since, tableId, store, queryClient }),
      );
    },
    [queryClient, store, tableId, applies],
  );
  useTableRoom({ tableId, onChange, onJoined: refetchTable });
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
  change: Exclude<TableChange, { type: 'reload' }>;
  since: number;
  tableId: string;
  store: ApTableStore;
  queryClient: QueryClient;
}) {
  await store.getState().waitForSaves();
  const state = store.getState();
  if (change.type === 'cleared') {
    state.clearRecords({ since });
    return;
  }
  const knownFieldIds = new Set(state.serverFields.map((field) => field.id));
  const hasUnknownField = change.records.some((record) =>
    Object.keys(record.cells).some((fieldId) => !knownFieldIds.has(fieldId)),
  );
  if (hasUnknownField) {
    queryClient.invalidateQueries({
      queryKey: tableQueryKeys.fields(tableId),
    });
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

function syncedKeys(tableId: string): QueryKey[] {
  return [
    tableQueryKeys.table(tableId),
    tableQueryKeys.fields(tableId),
    tableQueryKeys.records(tableId),
  ];
}

async function snapshotOf<T>(fetch: () => Promise<T>): Promise<Snapshot<T>> {
  const since = tableSyncClock.tick();
  return { data: await fetch(), since };
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

type Snapshot<T> = { data: T; since: number };
