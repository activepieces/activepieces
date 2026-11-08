import { isNil, SeekPage, tryCatch } from '@activepieces/core-utils';
import { Field, Table, PopulatedRecord } from '@activepieces/shared';
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
import { buttonVariants } from '@/components/ui/button';
import {
  followAlong,
  useOnFollowUpdate,
} from '@/features/chat/lib/follow/follow-along';
import { aiHighlight } from '@/features/chat/lib/follow/use-ai-highlight';
import {
  TableState,
  ApTableStore,
  createApTableStore,
} from '@/features/tables/stores/store/ap-tables-client-state';
import { useResourceLock } from '@/hooks/use-resource-lock';
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
  onStore,
}: {
  children: React.ReactNode;
  table: Table;
  fields: Field[];
  records: PopulatedRecord[];
  onStore?: (store: ApTableStore) => void;
}) => {
  const tableStoreRef = useRef<ApTableStore>(
    createApTableStore(table, fields, records),
  );
  useEffect(() => {
    onStore?.(tableStoreRef.current);
  }, [onStore]);
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
  const storeRef = useRef<ApTableStore | null>(null);
  const onStore = useCallback((store: ApTableStore) => {
    storeRef.current = store;
  }, []);
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

  useFollowTableUpdates({
    tableId,
    records: records?.data,
    fields,
    storeRef,
    rebuild: () => setRefreshKey((key) => key + 1),
  });

  // rebuilds the table store from freshly fetched server state without
  // reloading the document (a full reload breaks the embed SDK handshake
  // inside an iframe)
  const refreshTableState = useCallback(async () => {
    await Promise.all([
      queryClient.refetchQueries({ queryKey: ['table', tableId] }),
      queryClient.refetchQueries({ queryKey: ['fields', tableId] }),
      queryClient.refetchQueries({ queryKey: ['records', tableId] }),
    ]);
    setRefreshKey((key) => key + 1);
  }, [queryClient, tableId]);

  if (isTableLoading || isFieldsLoading || isRecordsLoading) {
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
          onStore={onStore}
        >
          {children}
        </TableStateProviderWithTable>
      </TableLockProvider>
    </TableRefreshContext.Provider>
  );
}

function useFollowTableUpdates({
  tableId,
  records,
  fields,
  storeRef,
  rebuild,
}: {
  tableId: string | undefined;
  records: PopulatedRecord[] | undefined;
  fields: Field[] | undefined;
  storeRef: React.RefObject<ApTableStore | null>;
  rebuild: () => void;
}) {
  const queryClient = useQueryClient();
  const seen = useRef<PopulatedRecord[] | null>(null);
  const seenFields = useRef<Field[] | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);
  const cancel = useCallback(() => {
    generation.current += 1;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  useEffect(() => {
    if (seen.current === null && records) seen.current = records;
  }, [records]);
  useEffect(() => {
    if (seenFields.current === null && fields) seenFields.current = fields;
  }, [fields]);
  useEffect(() => {
    seen.current = null;
    seenFields.current = null;
    return cancel;
  }, [tableId, cancel]);

  const later = ({ run, ms }: { run: () => void; ms: number }) => {
    const current = generation.current;
    timer.current = setTimeout(() => {
      timer.current = null;
      if (generation.current === current) run();
    }, ms);
  };

  const apply = () => {
    const fresh = queryClient.getQueryData<SeekPage<PopulatedRecord>>([
      'records',
      tableId,
    ])?.data;
    if (!fresh) return;
    const freshFields =
      queryClient.getQueryData<Field[]>(['fields', tableId]) ?? [];
    const before = new Map((seen.current ?? []).map((r) => [r.id, r]));
    const fieldsBefore = new Set(
      (seenFields.current ?? freshFields).map((field) => field.id),
    );
    const freshIds = new Set(fresh.map((record) => record.id));
    const removed = [...before.keys()].filter((id) => !freshIds.has(id));
    seen.current = fresh;
    seenFields.current = freshFields;
    const lightUp = () => {
      rebuild();
      followAlong.flash([
        ...freshFields
          .filter((field) => !fieldsBefore.has(field.id))
          .map((field) => `table-field:${field.id}`),
        ...changedCellKeys({ fresh, before }),
      ]);
    };
    if (removed.length === 0 || aiHighlight.prefersReducedMotion()) {
      lightUp();
      return;
    }
    followAlong.flash(removed.map((id) => `table-row-deleted:${id}`));
    later({ run: lightUp, ms: DELETED_ROW_FADE_MS });
  };

  const refetchThenApply = () => {
    const current = generation.current;
    tryCatch(() =>
      Promise.all(
        ['records', 'fields'].map((name) =>
          queryClient.refetchQueries({ queryKey: [name, tableId] }),
        ),
      ),
    )
      .then(() => {
        if (generation.current === current) apply();
      })
      .catch(() => undefined);
  };

  const applyWhenIdle = ({ waited }: { waited: number }) => {
    const saving = storeRef.current?.getState().isSaving ?? false;
    const busy = isEditingCell() || (saving && waited < MAX_SAVE_WAIT_MS);
    if (busy) {
      later({
        run: () => applyWhenIdle({ waited: waited + RECHECK_MS }),
        ms: RECHECK_MS,
      });
      return;
    }
    if (waited > 0) refetchThenApply();
    else apply();
  };

  useOnFollowUpdate({
    resource: tableId ? { kind: 'table', id: tableId } : null,
    handler: () => {
      cancel();
      applyWhenIdle({ waited: 0 });
    },
  });
}

function changedCellKeys({
  fresh,
  before,
}: {
  fresh: PopulatedRecord[];
  before: Map<string, PopulatedRecord>;
}): string[] {
  return fresh.flatMap((record) => {
    const old = before.get(record.id);
    if (!old) return [`table-row:${record.id}`];
    return Object.entries(record.cells)
      .filter(([fieldId, cell]) => old.cells[fieldId]?.value !== cell.value)
      .map(([fieldId]) => `table-cell:${record.id}:${fieldId}`);
  });
}

function isEditingCell(): boolean {
  const active = document.activeElement;
  return (
    active instanceof HTMLElement &&
    active.closest('.rdg') !== null &&
    (active instanceof HTMLInputElement ||
      active instanceof HTMLTextAreaElement ||
      active.isContentEditable)
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

type TableLockContextValue = ReturnType<typeof useResourceLock>;

const DELETED_ROW_FADE_MS = 1200;
const RECHECK_MS = 400;
const MAX_SAVE_WAIT_MS = 15_000;
