import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { FileX } from 'lucide-react';
import { createContext, useContext, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStore } from 'zustand';

import { buttonVariants } from '@/components/ui/button';
import { LoadingScreen } from '@/components/ui/loading-screen';
import {
  TableState,
  ApTableStore,
  createApTableStore,
} from '@/features/tables/lib/store/ap-tables-client-state';
import { cn } from '@/lib/utils';
import { Field, Table, PopulatedRecord, isNil } from '@activepieces/shared';

import { fieldsApi } from '../lib/fields-api';
import { recordsApi } from '../lib/records-api';
import { tablesApi } from '../lib/tables-api';

const TableContext = createContext<ApTableStore | null>(null);

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
    queryFn: () => fieldsApi.list(tableId!),
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

  if (isTableLoading || isFieldsLoading || isRecordsLoading) {
    return (
      <div className="flex justify-center items-center h-full w-full pb-6">
        <LoadingScreen mode="container" />
      </div>
    );
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
        <div className="rounded-full bg-muted p-4">
          <FileX className="h-10 w-10 text-muted-foreground" />
        </div>

        <div>
          <h2 className="text-lg font-semibold">{t('Table not available')}</h2>
          <p className="text-sm text-muted-foreground">
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
    <TableStateProviderWithTable
      table={table}
      fields={fields}
      records={records.data}
    >
      {children}
    </TableStateProviderWithTable>
  );
}

export function useTableState<T>(selector: (state: TableState) => T) {
  const tableStore = useContext(TableContext);
  if (!tableStore) {
    throw new Error('Table context not found');
  }
  return useStore(tableStore, selector);
}
