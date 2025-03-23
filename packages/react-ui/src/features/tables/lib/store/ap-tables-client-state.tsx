import { nanoid } from 'nanoid';
import { create } from 'zustand';

import { Field, FieldType, PopulatedRecord, Table } from '@activepieces/shared';

import { createServerState } from './ap-tables-server-state';

export type ClientCellData = {
  fieldIndex: number;
  value: unknown;
};

export type ClientRecordData = {
  uuid: string;
  values: ClientCellData[];
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

export type TableState = {
  isSaving: boolean;
  selectedRows: ReadonlySet<string>;
  fields: ClientField[];
  records: ClientRecordData[];
  table: Table;
  setSelectedRows: (selectedRows: ReadonlySet<string>) => void;
  selectedCell: {
    rowIdx: number;
    columnIdx: number;
  } | null;
  setSelectedCell: (
    selectedCell: { rowIdx: number; columnIdx: number } | null,
  ) => void;
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
      selectedRows: new Set(),
      table,
      setSelectedRows: (selectedRows: ReadonlySet<string>) =>
        set({ selectedRows }),
      selectedCell: null,
      renameTable: (newName: string) =>
        set((state) => {
          return {
            table: {
              ...state.table,
              name: newName,
            },
          };
        }),
      setSelectedCell: (
        selectedCell: { rowIdx: number; columnIdx: number } | null,
      ) => set({ selectedCell }),
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
      records: records.map((record) => ({
        uuid: nanoid(),
        values: Object.entries(record.cells).map(([fieldId, cell]) => ({
          fieldIndex: fields.findIndex((field) => field.id === fieldId),
          value: cell.value,
        })),
      })),
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
    };
  });
};

export type ApTableStore = ReturnType<typeof createApTableStore>;
