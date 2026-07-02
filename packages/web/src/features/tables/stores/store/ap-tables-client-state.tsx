import {
  Field,
  FieldType,
  PopulatedRecord,
  Table,
  TableAutomationStatus,
  TableColor,
} from '@activepieces/shared';
import { nanoid } from 'nanoid';
import { create } from 'zustand';

import { createServerState } from './ap-tables-server-state';

export type ClientCellData = {
  fieldIndex: number;
  value: unknown;
  color?: TableColor | null;
};

export type ClientRecordData = {
  uuid: string;
  recordId: string | null;
  agentRunId: string | null;
  values: ClientCellData[];
  color?: TableColor | null;
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
    recordId: record.id,
    agentRunId: null,
    color: record.color ?? null,
    values: Object.entries(record.cells).map(([fieldId, cell]) => ({
      fieldIndex: fields.findIndex((field) => field.id === fieldId),
      value: cell.value,
      color: cell.color ?? null,
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
  selectedRange: {
    x: number;
    y: number;
    x1: number;
    y1: number;
  } | null;
  setSelectedRange: (
    selectedRange: { x: number; y: number; x1: number; y1: number } | null,
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
  setRecordColorsLocal: (
    recordUuids: string[],
    color: TableColor | null,
  ) => void;
  toggleStatus: () => void;
  lockedByOtherUser: boolean;
  setLockedByOtherUser: (locked: boolean) => void;
  serverFields: Field[];
  serverRecords: PopulatedRecord[];
  recentlyChanged: RecentlyChanged;
  exitingRows: Record<string, number>;
  applyServerDelta: (delta: TableServerDelta) => void;
  setRowsExiting: (recordIds: string[]) => void;
  reconcileServerSnapshot: (snapshot: {
    fields: Field[];
    records: PopulatedRecord[];
  }) => void;
  clearExpiredHighlights: () => void;
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
      ) => set({ selectedCell }),
      selectedRange: null,
      setSelectedRange: (
        selectedRange: { x: number; y: number; x1: number; y1: number } | null,
      ) => set({ selectedRange }),
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
        return set(() => {
          return {
            records: mapRecorddToClientRecordsData(records, serverState.fields),
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
      // Manual (non-AI) color edits don't echo back through the realtime channel
      // (that's gated on the AI lock), so reflect them locally right away; the
      // server write persists them for the next load.
      setRecordColorsLocal: (recordUuids: string[], color: TableColor | null) =>
        set((state) => {
          const targets = new Set(recordUuids);
          return {
            records: state.records.map((record) =>
              targets.has(record.uuid) ? { ...record, color } : record,
            ),
          };
        }),
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
      recentlyChanged: { records: {}, cells: {} },
      exitingRows: {},
      applyServerDelta: (delta: TableServerDelta) => {
        mirrorDeltaToServerState(serverState, delta);
        set((state) => computeDeltaState(state, delta, true));
      },
      // The single source of the delete animation: the coordinator marks a row exiting
      // (border + disintegrate + track-collapse), then removes it after a fixed beat.
      setRowsExiting: (recordIds: string[]) =>
        set((state) => {
          if (recordIds.length === 0) {
            return {};
          }
          const until = Date.now() + EXITING_MS;
          const exitingRows = { ...state.exitingRows };
          recordIds.forEach((id) => {
            exitingRows[id] = until;
          });
          return { exitingRows };
        }),
      reconcileServerSnapshot: ({
        fields: snapshotFields,
        records: snapshotRecords,
      }) => {
        snapshotFields.forEach((field) => {
          mirrorDeltaToServerState(serverState, {
            kind: 'field-created',
            field,
          });
          set((state) =>
            computeDeltaState(state, { kind: 'field-created', field }, false),
          );
        });
        snapshotRecords.forEach((record) => {
          mirrorDeltaToServerState(serverState, {
            kind: 'record-updated',
            record,
          });
          set((state) =>
            computeDeltaState(state, { kind: 'record-updated', record }, false),
          );
        });
      },
      clearExpiredHighlights: () =>
        set((state) => {
          const now = Date.now();
          const records = filterExpired(state.recentlyChanged.records, now);
          const cells = filterExpired(state.recentlyChanged.cells, now);
          const exitingRows = filterExpired(state.exitingRows, now);
          const recentlyUnchanged =
            records === state.recentlyChanged.records &&
            cells === state.recentlyChanged.cells;
          if (recentlyUnchanged && exitingRows === state.exitingRows) {
            return {};
          }
          return {
            recentlyChanged: recentlyUnchanged
              ? state.recentlyChanged
              : { records, cells },
            exitingRows,
          };
        }),
    };
  });
};

function mapFieldToClientField(field: Field): ClientField {
  if (field.type === FieldType.STATIC_DROPDOWN) {
    return {
      uuid: field.id,
      name: field.name,
      type: field.type,
      data: field.data,
    };
  }
  return { uuid: field.id, name: field.name, type: field.type };
}

function buildClientValues(
  record: PopulatedRecord,
  fields: ClientField[],
): ClientCellData[] {
  return Object.entries(record.cells).flatMap(([fieldId, cell]) => {
    const fieldIndex = fields.findIndex((field) => field.uuid === fieldId);
    if (fieldIndex === -1) {
      return [];
    }
    return [{ fieldIndex, value: cell.value, color: cell.color ?? null }];
  });
}

function markChanged(
  prev: RecentlyChanged,
  recordIds: string[],
  cellKeys: string[],
): RecentlyChanged {
  if (recordIds.length === 0 && cellKeys.length === 0) {
    return prev;
  }
  const expiry = Date.now() + HIGHLIGHT_MS;
  const records = { ...prev.records };
  recordIds.forEach((id) => {
    records[id] = expiry;
  });
  const cells = { ...prev.cells };
  cellKeys.forEach((key) => {
    cells[key] = expiry;
  });
  return { records, cells };
}

function clearKeysForRecord(
  prev: RecentlyChanged,
  recordId: string,
): RecentlyChanged {
  const records = { ...prev.records };
  delete records[recordId];
  const cells = Object.fromEntries(
    Object.entries(prev.cells).filter(
      ([key]) => !key.startsWith(recordId + '_'),
    ),
  );
  return { records, cells };
}

function filterExpired(
  map: Record<string, number>,
  now: number,
): Record<string, number> {
  const entries = Object.entries(map).filter(([, expiry]) => expiry > now);
  if (entries.length === Object.keys(map).length) {
    return map;
  }
  return Object.fromEntries(entries);
}

function computeDeltaState(
  state: Pick<TableState, 'fields' | 'records' | 'recentlyChanged'>,
  delta: TableServerDelta,
  highlight: boolean,
): Partial<TableState> {
  switch (delta.kind) {
    case 'record-created':
    case 'record-updated': {
      const { record } = delta;
      const values = buildClientValues(record, state.fields);
      const index = state.records.findIndex((r) => r.recordId === record.id);
      const cellKey = (fieldIndex: number) =>
        record.id + '_' + state.fields[fieldIndex].uuid;
      if (index === -1) {
        const records = [
          ...state.records,
          {
            uuid: nanoid(),
            recordId: record.id,
            agentRunId: null,
            values,
            color: record.color ?? null,
          },
        ];
        const recentlyChanged = highlight
          ? markChanged(
              state.recentlyChanged,
              [record.id],
              values.map((value) => cellKey(value.fieldIndex)),
            )
          : state.recentlyChanged;
        return { records, recentlyChanged };
      }
      const existing = state.records[index];
      const changedCellKeys = values
        .filter((value) => {
          const prev = existing.values.find(
            (pv) => pv.fieldIndex === value.fieldIndex,
          );
          return !prev || prev.value !== value.value;
        })
        .map((value) => cellKey(value.fieldIndex));
      const records = state.records.map((r, i) =>
        i === index
          ? { ...r, recordId: record.id, values, color: record.color ?? null }
          : r,
      );
      const recentlyChanged = highlight
        ? markChanged(state.recentlyChanged, [], changedCellKeys)
        : state.recentlyChanged;
      return { records, recentlyChanged };
    }
    case 'record-deleted': {
      const records = state.records.filter(
        (r) => r.recordId !== delta.recordId,
      );
      if (records.length === state.records.length) {
        return {};
      }
      return {
        records,
        recentlyChanged: clearKeysForRecord(
          state.recentlyChanged,
          delta.recordId,
        ),
      };
    }
    case 'field-created': {
      if (state.fields.some((field) => field.uuid === delta.field.id)) {
        return {};
      }
      const newIndex = state.fields.length;
      const fields = [...state.fields, mapFieldToClientField(delta.field)];
      const records = state.records.map((record) => ({
        ...record,
        values: [...record.values, { fieldIndex: newIndex, value: '' }],
      }));
      return { fields, records };
    }
    case 'field-updated': {
      const fields = state.fields.map((field) =>
        field.uuid === delta.field.id
          ? mapFieldToClientField(delta.field)
          : field,
      );
      return { fields };
    }
    case 'field-deleted': {
      const removeIndex = state.fields.findIndex(
        (field) => field.uuid === delta.fieldId,
      );
      if (removeIndex === -1) {
        return {};
      }
      const fields = state.fields.filter((_, i) => i !== removeIndex);
      const records = state.records.map((record) => ({
        ...record,
        values: record.values
          .filter((value) => value.fieldIndex !== removeIndex)
          .map((value) =>
            value.fieldIndex > removeIndex
              ? { ...value, fieldIndex: value.fieldIndex - 1 }
              : value,
          ),
      }));
      return { fields, records };
    }
  }
}

function mirrorDeltaToServerState(
  serverState: ReturnType<typeof createServerState>,
  delta: TableServerDelta,
): void {
  switch (delta.kind) {
    case 'record-created':
    case 'record-updated':
      serverState.applyServerRecord(delta.record);
      break;
    case 'record-deleted':
      serverState.removeServerRecord(delta.recordId);
      break;
    case 'field-created':
    case 'field-updated':
      serverState.applyServerField(delta.field);
      break;
    case 'field-deleted':
      serverState.removeServerField(delta.fieldId);
      break;
  }
}

const HIGHLIGHT_MS = 1500;
// Safety lifetime for the exiting-row mark — the coordinator removes the row on its own keyed
// timer well before this; this is just the backstop so a dropped timer can't strand a row.
const EXITING_MS = 2000;

export type RecentlyChanged = {
  records: Record<string, number>;
  cells: Record<string, number>;
};

export type TableServerDelta =
  | { kind: 'record-created'; record: PopulatedRecord }
  | { kind: 'record-updated'; record: PopulatedRecord }
  | { kind: 'record-deleted'; recordId: string }
  | { kind: 'field-created'; field: Field }
  | { kind: 'field-updated'; field: Field }
  | { kind: 'field-deleted'; fieldId: string };

export type ApTableStore = ReturnType<typeof createApTableStore>;
