import { nanoid } from 'nanoid';
import { create } from 'zustand';

import {
  Field,
  FieldType,
  PopulatedAgent,
  PopulatedRecord,
  Table,
  TableAutomationStatus,
  AgentRun,
  isNil,
} from '@activepieces/shared';

import { createServerState } from './ap-tables-server-state';

export type ClientCellData = {
  fieldIndex: number;
  value: unknown;
};

export type ClientRecordData = {
  uuid: string;
  agentRunId: string | null;
  values: ClientCellData[];
  isTemporary?: boolean;
};

export type ClientField = {
  uuid: string;
  name: string;
} & (
  | {
      type: FieldType.DATE | FieldType.NUMBER | FieldType.TEXT;
    }
  | {
      type: FieldType.STATIC_DROPDOWN;
      data: {
        options: { value: string }[];
      };
    }
);
const mapRecorddToClientRecordsData = (
  records: PopulatedRecord[],
  fields: Field[],
): ClientRecordData[] => {
  return records.map((record) => ({
    uuid: nanoid(),
    agentRunId: null,
    values: Object.entries(record.cells).map(([fieldId, cell]) => ({
      fieldIndex: fields.findIndex((field) => field.id === fieldId),
      value: cell.value,
    })),
  }));
};

export type TableState = {
  isSaving: boolean;
  selectedRecords: ReadonlySet<string>;
  fields: ClientField[];
  records: ClientRecordData[];
  table: Table;
  setSelectedRecords: (selectedRecords: ReadonlySet<string>) => void;
  selectedCell: {
    rowIdx: number;
    columnIdx: number;
    recordId: string;
  } | null;
  setSelectedCell: (
    selectedCell: { rowIdx: number; columnIdx: number; recordId: string } | null,
  ) => void;
  selectedAgentRunId: string | null;
  setSelectedAgentRunId: (agentRunId: string | null) => void;
  createRecord: (recordData: ClientRecordData) => void;
  updateRecord: (
    recordIndex: number,
    recordData: Pick<ClientRecordData, 'values'>,
  ) => void;
  deleteRecords: (recordIndices: string[]) => void;
  createField: (field: ClientField) => void;
  deleteField: (fieldIndex: number) => void;
  renameTable: (newName: string) => void;
  renameField: (fieldIndex: number, newName: string) => void;
  setRecords: (records: PopulatedRecord[]) => void;
  setAgentRunId: (recordId: string, agentRunId: string | null) => void;
  toggleStatus: () => void;
  serverFields: Field[];
  serverRecords: PopulatedRecord[];
  updateAgent: (agent: PopulatedAgent) => void;
  runs: AgentRun[];
  setRuns: (runs: AgentRun[]) => void;
  createTemporaryRecord: (recordData: ClientRecordData) => void;
};

export const createApTableStore = (
  table: Table,
  fields: Field[],
  records: PopulatedRecord[],
  runs: AgentRun[],
) => {
  return create<TableState>((set, get) => {
    const serverState = createServerState(
      table,
      fields,
      records,
      (isSaving: boolean) => set({ isSaving }),
    );
    const selectedCell =
      records.length > 0
        ? {
            rowIdx: 0,
            columnIdx: 1,
            recordId: nanoid(),
          }
        : null;

    return {
      isSaving: false,
      selectedRecords: new Set(),
      table,
      setSelectedRecords: (selectedRecords: ReadonlySet<string>) =>
        set({ selectedRecords }),
      selectedCell: selectedCell,
      selectedAgentRunId: null,
      setSelectedAgentRunId: (agentRunId: string | null) =>
        set({ selectedAgentRunId: agentRunId }),
      renameTable: (newName: string) =>
        set((state) => {
          serverState.update({
            name: newName,
          });
          return {
            table: {
              ...state.table,
              name: newName,
            },
          };
        }),
      setSelectedCell: (
        selectedCell: { rowIdx: number; columnIdx: number; recordId: string } | null,
      ) => {
        const state = get();
        const previousRowIdx = state.selectedCell?.rowIdx;
        const previousRecordId = state.selectedCell?.recordId;

        const hasRowChanged = !isNil(previousRowIdx) && previousRowIdx !== selectedCell?.rowIdx;
        
        if (hasRowChanged) {
          const previousRecord = state.records.find(r => r.uuid === previousRecordId);
          if (previousRecord?.isTemporary) {
            setTimeout(() => {
              const currentState = get();
              const recordIndex = currentState.records.findIndex(r => r.uuid === previousRecordId);
              if (recordIndex === -1) return;

              const record = currentState.records[recordIndex];
              if (!record.isTemporary) return;

              const permanentRecord = { ...record, isTemporary: false };
              serverState.createRecord(permanentRecord);
              
              set((state) => ({
                records: state.records.map((r, index) =>
                  index === recordIndex ? permanentRecord : r
                ),
              }));
            }, 0);
          }
        }
        return set({ selectedCell });
      },
      fields: fields.map((field) => {
        if (field.type === FieldType.STATIC_DROPDOWN) {
          return {
            uuid: field.id,
            name: field.name,
            type: field.type,
            data: field.data,
          };
        }
        return {
          uuid: field.id,
          name: field.name,
          type: field.type,
        };
      }),
      records: mapRecorddToClientRecordsData(records, fields),
      createRecord: (recordData: ClientRecordData) => {
        serverState.createRecord(recordData);
        return set((state) => {
          return {
            records: [...state.records, recordData],
          };
        });
      },
      updateRecord: (
        recordIndex: number,
        recordData: Pick<ClientRecordData, 'values'>,
      ) => {
        serverState.updateRecord(recordIndex, recordData);
        return set((state) => {
          return {
            records: state.records.map((record, index) =>
              index === recordIndex ? { ...record, ...recordData } : record,
            ),
          };
        });
      },
      deleteRecords: (recordIndices: string[]) =>
        set((state) => {
          serverState.deleteRecords(recordIndices);
          return {
            records: state.records.filter(
              (_, index) => !recordIndices.includes(index.toString()),
            ),
          };
        }),
      createField: (field: ClientField) => {
        serverState.createField({ ...field, tableId: table.id });
        set((state) => {
          const newState: TableState = {
            ...state,
            fields: [...state.fields, field],
            records: state.records.map((record) => ({
              ...record,
              values: [
                ...record.values,
                {
                  fieldIndex: state.fields.length,
                  value: '',
                },
              ],
            })),
          };
          return newState;
        });
      },
      deleteField: (fieldIndex: number) => {
        serverState.deleteField(fieldIndex);
        return set((state) => {
          return {
            records: state.records.map((record) => ({
              ...record,
              values: record.values.filter((_, index) => index !== fieldIndex),
            })),
            fields: state.fields.filter((_, index) => index !== fieldIndex),
          };
        });
      },
      renameField: (fieldIndex: number, newName: string) => {
        serverState.renameField(fieldIndex, newName);
        return set((state) => {
          return {
            fields: state.fields.map((field, index) =>
              index === fieldIndex ? { ...field, name: newName } : field,
            ),
          };
        });
      },
      setRecords: (records: PopulatedRecord[]) => {
        serverState.setRecords(records);
        return set((state) => {
          return {
            records: mapRecorddToClientRecordsData(records, serverState.fields),
          };
        });
      },
      updateAgent: (agent: PopulatedAgent) => {
        return set((state) => {
          return {
            table: {
              ...state.table,
              agent: agent,
            },
          };
        });
      },
      setAgentRunId: (recordId: string, agentRunId: string | null) => {
        const recordIndex = serverState.records.findIndex(
          (record) => record.id === recordId,
        );
        set((state) => ({
          records: state.records.map((record, index) =>
            index === recordIndex ? { ...record, agentRunId } : record,
          ),
        }));
      },
      setRuns: (runs: AgentRun[]) => {
        return set({ runs });
      },
      toggleStatus: () => {
        return set((state) => {
          const newStatus =
            state.table.status === TableAutomationStatus.ENABLED
              ? TableAutomationStatus.DISABLED
              : TableAutomationStatus.ENABLED;
          serverState.update({
            status: newStatus,
          });
          return {
            table: {
              ...state.table,
              status: newStatus,
            },
          };
        });
      },
      serverFields: serverState.fields,
      serverRecords: serverState.records,
      runs: runs,
      createTemporaryRecord: (recordData: ClientRecordData) => {
        const tempRecord = { ...recordData, isTemporary: true };
        return set((state) => {
          return {
            records: [...state.records, tempRecord],
          };
        });
      },
    };
  });
};

export type ApTableStore = ReturnType<typeof createApTableStore>;
