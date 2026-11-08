import {
  Field,
  FieldType,
  PopulatedRecord,
  Table,
  TableAutomationStatus,
} from '@activepieces/shared';
import { nanoid } from 'nanoid';
import { create } from 'zustand';

import { createServerState } from './ap-tables-server-state';

export type ClientCellData = {
  fieldIndex: number;
  value: unknown;
};

export type ClientRecordData = {
  uuid: string;
  agentRunId: string | null;
  values: ClientCellData[];
};

export type ClientField = {
  uuid: string;
  name: string;
} & (
  | {
      type:
        | FieldType.DATE
        | FieldType.DATETIME
        | FieldType.NUMBER
        | FieldType.TEXT;
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
  previous?: Map<string, Pick<ClientRecordData, 'uuid' | 'agentRunId'>>,
): ClientRecordData[] => {
  return records.map((record) => ({
    uuid: previous?.get(record.id)?.uuid ?? nanoid(),
    agentRunId: previous?.get(record.id)?.agentRunId ?? null,
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
  } | null;
  setSelectedCell: (
    selectedCell: { rowIdx: number; columnIdx: number } | null,
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
  reorderField: (fieldIndex: number, targetIndex: number) => void;
  setRecords: (records: PopulatedRecord[]) => void;
  syncFromServer: (fresh: {
    table: Table;
    fields: Field[];
    records: PopulatedRecord[];
  }) => void;
  setAgentRunId: (recordId: string, agentRunId: string | null) => void;
  toggleStatus: () => void;
  lockedByOtherUser: boolean;
  setLockedByOtherUser: (locked: boolean) => void;
  serverFields: Field[];
  serverRecords: PopulatedRecord[];
};

export const createApTableStore = (
  table: Table,
  fields: Field[],
  records: PopulatedRecord[],
) => {
  return create<TableState>((set) => {
    const serverState = createServerState(
      table,
      fields,
      records,
      (isSaving: boolean) => set({ isSaving }),
    );
    return {
      isSaving: false,
      selectedRecords: new Set(),
      table,
      setSelectedRecords: (selectedRecords: ReadonlySet<string>) =>
        set({ selectedRecords }),
      selectedCell: null,
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
        selectedCell: { rowIdx: number; columnIdx: number } | null,
      ) =>
        set((state) =>
          state.selectedCell?.rowIdx === selectedCell?.rowIdx &&
          state.selectedCell?.columnIdx === selectedCell?.columnIdx
            ? state
            : { selectedCell },
        ),
      fields: mapFieldsToClientFields(fields),
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
        const updatedFieldIndexes = new Set(
          recordData.values.map((cell) => cell.fieldIndex),
        );
        return set((state) => {
          return {
            records: state.records.map((record, index) =>
              index === recordIndex
                ? {
                    ...record,
                    values: [
                      ...record.values.filter(
                        (cell) => !updatedFieldIndexes.has(cell.fieldIndex),
                      ),
                      ...recordData.values,
                    ].sort((a, b) => a.fieldIndex - b.fieldIndex),
                  }
                : record,
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
              values: record.values
                .filter((cell) => cell.fieldIndex !== fieldIndex)
                .map((cell) => ({
                  ...cell,
                  fieldIndex:
                    cell.fieldIndex > fieldIndex
                      ? cell.fieldIndex - 1
                      : cell.fieldIndex,
                })),
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
      reorderField: (fieldIndex: number, targetIndex: number) => {
        if (fieldIndex === targetIndex) {
          return;
        }
        serverState.reorderField(fieldIndex, targetIndex);
        return set((state) => {
          const reorderedFields = [...state.fields];
          const [movedField] = reorderedFields.splice(fieldIndex, 1);
          reorderedFields.splice(targetIndex, 0, movedField);
          const newIndexByUuid = new Map(
            reorderedFields.map((field, index) => [field.uuid, index]),
          );
          const oldToNewIndex = state.fields.map(
            (field) => newIndexByUuid.get(field.uuid) ?? 0,
          );
          return {
            fields: reorderedFields,
            records: state.records.map((record) => ({
              ...record,
              values: record.values
                .map((cell) => ({
                  ...cell,
                  fieldIndex: oldToNewIndex[cell.fieldIndex],
                }))
                .sort((a, b) => a.fieldIndex - b.fieldIndex),
            })),
          };
        });
      },
      setRecords: (records: PopulatedRecord[]) => {
        serverState.setRecords(records);
        return set(() => {
          return {
            records: mapRecorddToClientRecordsData(records, serverState.fields),
          };
        });
      },
      syncFromServer: (fresh) => {
        set((state) => {
          const previous = new Map(
            serverState.records.map((record, index) => [
              record.id,
              {
                uuid: state.records[index]?.uuid ?? nanoid(),
                agentRunId: state.records[index]?.agentRunId ?? null,
              },
            ]),
          );
          serverState.replaceAll({
            fields: fresh.fields,
            records: fresh.records,
          });
          const nextRecords = mapRecorddToClientRecordsData(
            fresh.records,
            fresh.fields,
            previous,
          );
          const uuids = new Set(nextRecords.map((record) => record.uuid));
          const selectedCell =
            state.selectedCell &&
            state.selectedCell.rowIdx < nextRecords.length &&
            state.selectedCell.columnIdx <= fresh.fields.length
              ? state.selectedCell
              : null;
          return {
            table: { ...state.table, ...fresh.table },
            fields: mapFieldsToClientFields(fresh.fields),
            records: nextRecords,
            selectedCell,
            selectedRecords: new Set(
              [...state.selectedRecords].filter((uuid) => uuids.has(uuid)),
            ),
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
      lockedByOtherUser: false,
      setLockedByOtherUser: (locked: boolean) =>
        set({ lockedByOtherUser: locked }),
      serverFields: serverState.fields,
      serverRecords: serverState.records,
    };
  });
};

function mapFieldsToClientFields(fields: Field[]): ClientField[] {
  return fields.map((field) => {
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
  });
}

export type ApTableStore = ReturnType<typeof createApTableStore>;
