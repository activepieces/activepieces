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
): ClientRecordData[] => {
  return records.map((record) => ({
    uuid: nanoid(),
    agentRunId: null,
    values: mapCellsToClientValues(record, fields),
  }));
};

const mapCellsToClientValues = (
  record: PopulatedRecord,
  fields: Field[],
): ClientCellData[] =>
  Object.entries(record.cells).flatMap(([fieldId, cell]) => {
    const fieldIndex = fields.findIndex((field) => field.id === fieldId);
    return fieldIndex === -1 ? [] : [{ fieldIndex, value: cell.value }];
  });

const mapFieldToClientField = (field: Field): ClientField =>
  field.type === FieldType.STATIC_DROPDOWN
    ? { uuid: field.id, name: field.name, type: field.type, data: field.data }
    : { uuid: field.id, name: field.name, type: field.type };

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
  waitForSaves: () => Promise<void>;
  applyServerTable: (snapshot: { table: Table; since: number }) => void;
  applyServerFields: (snapshot: { fields: Field[]; since: number }) => void;
  applyServerRecords: (snapshot: {
    records: PopulatedRecord[];
    since: number;
  }) => Map<string, string>;
  applyRecordChanges: (change: {
    records: PopulatedRecord[];
    removedIds: string[];
    since: number;
  }) => Map<string, string>;
  setAgentRunId: (recordId: string, agentRunId: string | null) => void;
  toggleStatus: () => void;
  lockedByOtherUser: boolean;
  setLockedByOtherUser: (locked: boolean) => void;
  serverFields: Field[];
  getServerRecords: () => PopulatedRecord[];
};

export const createApTableStore = (
  table: Table,
  fields: Field[],
  records: PopulatedRecord[],
) => {
  return create<TableState>((set, get) => {
    const serverState = createServerState(
      table,
      fields,
      records,
      (isSaving: boolean) => set({ isSaving }),
    );
    const mergeRecords = ({
      changed,
      removedIds,
      since,
      dropMissing,
    }: {
      changed: PopulatedRecord[];
      removedIds: string[];
      since: number;
      dropMissing: boolean;
    }): Map<string, string> => {
      const state = get();
      const local = serverState.records;
      const removed = new Set(removedIds);
      const isNewer = (id: string) => !serverState.changedSince({ id, since });
      const changedById = new Map(changed.map((record) => [record.id, record]));
      const kept = local.flatMap((record, index) => {
        const row = state.records[index];
        const update = changedById.get(record.id);
        changedById.delete(record.id);
        if (!isNewer(record.id)) return [{ record, row }];
        if (removed.has(record.id)) return [];
        if (!update) return dropMissing ? [] : [{ record, row }];
        const values = mapCellsToClientValues(update, serverState.fields);
        return [{ record: update, row: { ...row, values } }];
      });
      const added = [...changedById.values()].filter((record) =>
        isNewer(record.id),
      );
      const addedRows = mapRecorddToClientRecordsData(
        added,
        serverState.fields,
      );
      const merged = [
        ...kept,
        ...added.map((record, index) => ({ record, row: addedRows[index] })),
      ];
      const rows = [
        ...merged.map(({ row }) => row),
        ...state.records.slice(local.length),
      ];
      serverState.setRecords(merged.map(({ record }) => record));
      set({ records: rows, ...selectionFor({ state, rows }) });
      const appliedIds = new Set(
        changed.map((record) => record.id).filter(isNewer),
      );
      return new Map(
        merged
          .filter(({ record }) => appliedIds.has(record.id))
          .map(({ record, row }) => [record.id, row.uuid]),
      );
    };
    const selectedCell =
      records.length > 0
        ? {
            rowIdx: 0,
            columnIdx: 1,
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
        selectedCell: { rowIdx: number; columnIdx: number } | null,
      ) =>
        set((state) =>
          state.selectedCell?.rowIdx === selectedCell?.rowIdx &&
          state.selectedCell?.columnIdx === selectedCell?.columnIdx
            ? state
            : { selectedCell },
        ),
      fields: fields.map(mapFieldToClientField),
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
      waitForSaves: () => serverState.idle(),
      applyServerTable: ({ table: fresh, since }) => {
        if (serverState.changedSince({ id: fresh.id, since })) return;
        serverState.replaceTable(fresh);
        set({ table: fresh });
      },
      applyServerFields: ({ fields: fresh, since }) => {
        const touched = [...serverState.fields, ...fresh].some((field) =>
          serverState.changedSince({ id: field.id, since }),
        );
        if (touched) return;
        serverState.replaceFields(fresh);
        set((state) => ({
          fields: fresh.map(mapFieldToClientField),
          records: state.records.map((row, index) => {
            const record = serverState.records[index];
            return record
              ? { ...row, values: mapCellsToClientValues(record, fresh) }
              : row;
          }),
        }));
      },
      applyServerRecords: ({ records: fresh, since }) =>
        mergeRecords({
          changed: fresh,
          removedIds: [],
          since,
          dropMissing: true,
        }),
      applyRecordChanges: ({ records: changed, removedIds, since }) => {
        const rowIds = mergeRecords({
          changed,
          removedIds,
          since,
          dropMissing: false,
        });
        serverState.markKnown({
          ids: [...changed.map((record) => record.id), ...removedIds],
          at: since,
        });
        return rowIds;
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
      getServerRecords: () => serverState.records,
    };
  });
};

function selectionFor({
  state,
  rows,
}: {
  state: TableState;
  rows: ClientRecordData[];
}): Pick<TableState, 'selectedCell' | 'selectedRecords'> {
  const uuids = new Set(rows.map((row) => row.uuid));
  const selectedUuid =
    state.selectedCell && state.records[state.selectedCell.rowIdx]?.uuid;
  const selectedRowIdx = rows.findIndex((row) => row.uuid === selectedUuid);
  return {
    selectedCell:
      state.selectedCell && selectedRowIdx !== -1
        ? { ...state.selectedCell, rowIdx: selectedRowIdx }
        : null,
    selectedRecords: new Set(
      [...state.selectedRecords].filter((uuid) => uuids.has(uuid)),
    ),
  };
}

export type ApTableStore = ReturnType<typeof createApTableStore>;
