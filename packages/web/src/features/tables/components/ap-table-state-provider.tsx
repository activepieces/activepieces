import { isNil } from '@activepieces/core-utils';
import {
  Field,
  Table,
  PopulatedRecord,
  TableUpdatedEvent,
  WebsocketClientEvent,
} from '@activepieces/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { useSocket } from '@/components/providers/socket-provider';
import { buttonVariants } from '@/components/ui/button';
import {
  TableState,
  ApTableStore,
  createApTableStore,
} from '@/features/tables/stores/store/ap-tables-client-state';
import { useResourceLock } from '@/hooks/use-resource-lock';
import { editorSession } from '@/lib/editor-session';
import { cn } from '@/lib/utils';

import { fieldsApi } from '../api/fields-api';
import { recordsApi } from '../api/records-api';
import { tablesApi } from '../api/tables-api';

const TableContext = createContext<ApTableStore | null>(null);
const TableRefreshContext = createContext<(() => Promise<void>) | null>(null);
const TableLockContext = createContext<TableLockContextValue | null>(null);

export const TableStateProviderWithTable = ({
  children,
  table,
  fields,
  records,
  selectedCell,
}: {
  children: React.ReactNode;
  table: Table;
  fields: Field[];
  records: PopulatedRecord[];
  selectedCell?: TableState['selectedCell'];
}) => {
  const tableStoreRef = useRef<ApTableStore>(
    withSelectedCell({
      store: createApTableStore(table, fields, records),
      selectedCell,
    }),
  );
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
  const {
    data: table,
    isLoading: isTableLoading,
    error: tableError,
  } = useQuery({
    queryKey: ['table', tableId],
    queryFn: () => {
      return tablesApi.getById(tableId!);
    },
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
    queryKey: ['fields', tableId],
    queryFn: () =>
      fieldsApi.list({
        tableId: tableId!,
      }),
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
    queryKey: ['records', tableId],
    queryFn: () =>
      recordsApi.list({
        tableId: tableId!,
        limit: 99999999,
        cursor: undefined,
      }),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0,
  });

  // rebuilds the table store from freshly fetched server state without
  // reloading the document (a full reload breaks the embed SDK handshake
  // inside an iframe)
  const refetchTableState = useCallback(async () => {
    await Promise.all([
      queryClient.refetchQueries({ queryKey: ['table', tableId] }),
      queryClient.refetchQueries({ queryKey: ['fields', tableId] }),
      queryClient.refetchQueries({ queryKey: ['records', tableId] }),
    ]);
  }, [queryClient, tableId]);
  const remountTableState = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);
  const refreshTableState = useCallback(async () => {
    await refetchTableState();
    remountTableState();
  }, [refetchTableState, remountTableState]);
  const isLoading = isTableLoading || isFieldsLoading || isRecordsLoading;
  const viewBeforeRefresh = useRef<TableView | null>(null);
  const missedUpdateWhileLoading = useMissedUpdateWhileLoading({
    tableId,
    isLoading,
  });

  if (isLoading) {
    return <RouteLoadingBar />;
  }

  if (
    tableError ||
    fieldsError ||
    recordsError ||
    isNil(table) ||
    isNil(fields) ||
    isNil(records)
  ) {
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
      <TableLockProvider resourceId={table.id} onTakeOver={refreshTableState}>
        <TableStateProviderWithTable
          key={refreshKey}
          table={table}
          fields={fields}
          records={records.data}
          selectedCell={viewBeforeRefresh.current?.selectedCell}
        >
          <RefreshOnTableUpdated
            missedUpdateWhileLoading={missedUpdateWhileLoading}
            viewBeforeRefresh={viewBeforeRefresh}
            tableId={table.id}
            refetch={refetchTableState}
            remount={remountTableState}
          />
          {children}
        </TableStateProviderWithTable>
      </TableLockProvider>
    </TableRefreshContext.Provider>
  );
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

function useMissedUpdateWhileLoading({
  tableId,
  isLoading,
}: {
  tableId: string | undefined;
  isLoading: boolean;
}) {
  const socket = useSocket();
  const missed = useRef(false);
  const loading = useRef(isLoading);
  loading.current = isLoading;
  useEffect(() => {
    const onTableUpdated = (event: TableUpdatedEvent) => {
      if (loading.current && event.tableId === tableId) {
        missed.current = true;
      }
    };
    socket.on(WebsocketClientEvent.TABLE_UPDATED, onTableUpdated);
    return () => {
      socket.off(WebsocketClientEvent.TABLE_UPDATED, onTableUpdated);
    };
  }, [socket, tableId]);
  return missed;
}

function RefreshOnTableUpdated({
  missedUpdateWhileLoading,
  viewBeforeRefresh,
  tableId,
  refetch,
  remount,
}: {
  missedUpdateWhileLoading: React.MutableRefObject<boolean>;
  viewBeforeRefresh: React.MutableRefObject<TableView | null>;
  tableId: string;
  refetch: () => Promise<void>;
  remount: () => void;
}) {
  const socket = useSocket();
  const store = useContext(TableContext);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let requested = false;
    let stale = false;
    let disposed = false;
    const isBusy = () =>
      store?.getState().isSaving === true ||
      (store?.getState().selectedRecords.size ?? 0) > 0 ||
      !isNil(document.querySelector('[data-editing="true"]'));
    const refreshWhenIdle = async () => {
      if (disposed) {
        return;
      }
      if (isBusy()) {
        timer = setTimeout(runRefresh, BUSY_RETRY_MS);
        return;
      }
      stale = false;
      await refetch();
      if (disposed) {
        return;
      }
      if (stale || isBusy()) {
        timer = setTimeout(runRefresh, BUSY_RETRY_MS);
        return;
      }
      viewBeforeRefresh.current = {
        scrollTop: gridElement()?.scrollTop ?? 0,
        selectedCell: store?.getState().selectedCell ?? null,
      };
      remount();
    };
    const runRefresh = () => {
      refreshWhenIdle().catch(() => {
        requested = false;
      });
    };
    const requestRefresh = () => {
      stale = true;
      if (requested) {
        return;
      }
      requested = true;
      runRefresh();
    };
    const onTableUpdated = (event: TableUpdatedEvent) => {
      const isOtherEditorOnThisTable =
        event.tableId === tableId &&
        event.editorSessionId !== editorSession.getId();
      if (isOtherEditorOnThisTable) {
        requestRefresh();
      }
    };
    socket.on(WebsocketClientEvent.TABLE_UPDATED, onTableUpdated);
    socket.on('connect', requestRefresh);
    const savedView = viewBeforeRefresh.current;
    viewBeforeRefresh.current = null;
    if (!isNil(savedView)) {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          gridElement()?.scrollTo({
            top: savedView.scrollTop,
            behavior: 'instant',
          });
        }),
      );
    }
    if (missedUpdateWhileLoading.current) {
      missedUpdateWhileLoading.current = false;
      requestRefresh();
    }
    return () => {
      disposed = true;
      socket.off(WebsocketClientEvent.TABLE_UPDATED, onTableUpdated);
      socket.off('connect', requestRefresh);
      clearTimeout(timer);
    };
  }, [
    socket,
    store,
    tableId,
    refetch,
    remount,
    missedUpdateWhileLoading,
    viewBeforeRefresh,
  ]);
  return null;
}

function withSelectedCell({
  store,
  selectedCell,
}: {
  store: ApTableStore;
  selectedCell: TableState['selectedCell'] | undefined;
}): ApTableStore {
  if (selectedCell !== undefined) {
    store.setState({ selectedCell });
  }
  return store;
}

function gridElement(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.rdg');
}

const BUSY_RETRY_MS = 1000;

type TableView = {
  scrollTop: number;
  selectedCell: TableState['selectedCell'];
};

type TableLockContextValue = ReturnType<typeof useResourceLock>;
