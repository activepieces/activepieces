import { createContext, useContext, useRef } from 'react';
import { useStore } from 'zustand';

import {
  tableHooks,
  TableState,
  ApTableStore,
} from '@/features/tables/lib/ap-tables-hooks';

const TableContext = createContext<ApTableStore | null>(null);

export function ApTableStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const tableStoreRef = useRef<ApTableStore>(tableHooks.createApTableStore());
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
