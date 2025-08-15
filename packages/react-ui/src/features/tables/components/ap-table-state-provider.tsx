import { useQuery } from '@tanstack/react-query';
import { createContext, useContext, useRef } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useStore } from 'zustand';

import { LoadingScreen } from '@/components/ui/loading-screen';
import { agentRunsApi } from '@/features/agents/lib/agents-api';
import {
  TableState,
  ApTableStore,
  createApTableStore,
} from '@/features/tables/lib/store/ap-tables-client-state';
import { Field, Table, PopulatedRecord, AgentRun } from '@activepieces/shared';

import { fieldsApi } from '../lib/fields-api';
import { recordsApi } from '../lib/records-api';
import { tablesApi } from '../lib/tables-api';

const TableContext = createContext<ApTableStore | null>(null);

export const TableStateProviderWithTable = ({
  children,
  table,
  fields,
  records,
  runs,
}: {
  children: React.ReactNode;
  table: Table;
  fields: Field[];
  records: PopulatedRecord[];
  runs: AgentRun[];
}) => {
  const tableStoreRef = useRef<ApTableStore>(
    createApTableStore(table, fields, records, runs),
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
      if (!tableId) {
        throw new Error('Table ID not found');
      }
      return tablesApi.getById(tableId);
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
    queryFn: () => {
      if (!tableId) {
        throw new Error('Table ID not found');
      }
      return fieldsApi.list(tableId);
    },
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
    queryFn: () => {
      if (!tableId) {
        throw new Error('Table ID not found');
      }
      return recordsApi.list({
        tableId: tableId,
        limit: 99999999, // TODO: we should implement pagination in ui.
        cursor: undefined,
      });
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0,
  });

  const {
    data: runs,
    isLoading: isRunsLoading,
    error: runsError,
  } = useQuery({
    queryKey: ['runs', tableId],
    queryFn: () => {
      if (!table?.agent?.id) {
        throw new Error('Agent ID not found');
      }
      return agentRunsApi.list({ agentId: table.agent.id });
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0,
    enabled: !!table?.agent?.id,
  });
  if (tableError || fieldsError || recordsError || runsError) {
    return <Navigate to="/tables" />;
  }
  if (isTableLoading || isFieldsLoading || isRecordsLoading || isRunsLoading) {
    return (
      <div className="flex justify-center items-center h-full w-full pb-6">
        <LoadingScreen mode="container" />
      </div>
    );
  }
  if (!table || !fields || !records || !runs) {
    return <Navigate to="/tables" />;
  }
  return (
    <TableStateProviderWithTable
      table={table}
      fields={fields}
      records={records.data}
      runs={runs.data}
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
