import { createContext, useContext, useRef } from 'react';
import { useStore } from 'zustand';

import {
  tableHooks,
  TableState,
  TableStore,
} from '@/features/tables/lib/tables-hooks';

const TableContext = createContext<TableStore | null>(null);

export function TableStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const tableStoreRef = useRef<TableStore>(tableHooks.createTableStore());
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
