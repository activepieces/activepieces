import { useQuery } from '@tanstack/react-query';
import { createContext, useContext, useRef } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useStore } from 'zustand';

import { LoadingScreen } from '@/components/ui/loading-screen';
import {
  TableState,
  ApTableStore,
  createApTableStore,
} from '@/features/tables/lib/store/ap-tables-client-state';
import { Field, Table, PopulatedRecord } from '@activepieces/shared';

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
        limit: 99999999, // TODO: we should implement pagination in ui.
        cursor: undefined,
      }),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0,
  });
  if (tableError || fieldsError || recordsError) {
    return <Navigate to="/tables" />;
  }
  if (isTableLoading || isFieldsLoading || isRecordsLoading) {
    return (
      <div className="flex justify-center items-center h-full w-full pb-6">
        <LoadingScreen mode="container" />
      </div>
    );
  }
  if (!table || !fields || !records) {
    return <Navigate to="/tables" />;
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
