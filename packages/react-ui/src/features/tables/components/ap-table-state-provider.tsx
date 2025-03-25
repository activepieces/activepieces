import { useSuspenseQuery } from '@tanstack/react-query';
import { createContext, useContext, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from 'zustand';

import {
  TableState,
  ApTableStore,
  createApTableStore,
} from '@/features/tables/lib/store/ap-tables-client-state';

import { fieldsApi } from '../lib/fields-api';
import { recordsApi } from '../lib/records-api';
import { tablesApi } from '../lib/tables-api';

const TableContext = createContext<ApTableStore | null>(null);

type ApTableStateProviderProps = {
  children: React.ReactNode;
};
export function ApTableStateProvider({ children }: ApTableStateProviderProps) {
  const tableId = useParams().tableId;

  const { data: table } = useSuspenseQuery({
    queryKey: ['table', tableId],
    queryFn: () => tablesApi.getById(tableId!),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: fields } = useSuspenseQuery({
    queryKey: ['fields', tableId],
    queryFn: () => fieldsApi.list(tableId!),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: records } = useSuspenseQuery({
    queryKey: ['records', tableId],
    queryFn: () =>
      recordsApi.list({
        tableId: tableId!,
        cursor: undefined,
      }),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0,
  });

  const tableStoreRef = useRef<ApTableStore>(
    createApTableStore(table, fields, records.data),
  );
  return (
    <TableContext.Provider value={tableStoreRef.current}>
      {children}
    </TableContext.Provider>
  );
}

export function useTableState<T>(selector: (state: TableState) => T) {
  const tableStore = useContext(TableContext);
  if (!tableStore) {
    throw new Error('Table context not found');
  }
  return useStore(tableStore, selector);
}
