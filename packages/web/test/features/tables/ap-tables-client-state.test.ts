import {
  Field,
  FieldType,
  Table,
  TableAutomationStatus,
} from '@activepieces/shared';
import { describe, expect, it, vi } from 'vitest';

import { createApTableStore } from '@/features/tables/stores/store/ap-tables-client-state';

const serverUpdateRecord = vi.hoisted(() => vi.fn());

vi.mock('@/features/tables/stores/store/ap-tables-server-state', () => ({
  createServerState: () => ({ updateRecord: serverUpdateRecord }),
}));

const table: Table = {
  id: 'table-1',
  created: '2026-08-12T00:00:00.000Z',
  updated: '2026-08-12T00:00:00.000Z',
  name: 'New Table',
  projectId: 'project-1',
  externalId: 'table-1',
  status: TableAutomationStatus.ENABLED,
  trigger: null,
};

describe('createApTableStore', () => {
  it('does not notify subscribers when the same cell is selected again', () => {
    const store = createApTableStore(table, [], []);
    store.getState().setSelectedCell({ rowIdx: 0, columnIdx: 2 });

    const listener = vi.fn();
    store.subscribe(listener);

    store.getState().setSelectedCell({ rowIdx: 0, columnIdx: 2 });
    expect(listener).not.toHaveBeenCalled();

    store.getState().setSelectedCell({ rowIdx: 1, columnIdx: 2 });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getState().selectedCell).toEqual({ rowIdx: 1, columnIdx: 2 });
  });

  it('saves only the edited cell and keeps the rest of the row', () => {
    const fields = ['a', 'b', 'c'].map(
      (id, position): Field => ({
        id,
        created: table.created,
        updated: table.updated,
        name: id,
        externalId: id,
        type: FieldType.TEXT,
        tableId: table.id,
        projectId: table.projectId,
        position,
      }),
    );
    const cell = (fieldName: string, value: string) => ({
      created: table.created,
      updated: table.updated,
      value,
      fieldName,
    });
    const store = createApTableStore(table, fields, [
      {
        id: 'record-1',
        created: table.created,
        updated: table.updated,
        tableId: table.id,
        projectId: table.projectId,
        cells: {
          c: cell('c', 'c-value'),
          a: cell('a', 'a-value'),
          b: cell('b', 'b-value'),
        },
      },
    ]);

    const edit = { values: [{ fieldIndex: 0, value: 'a-edited' }] };
    store.getState().updateRecord(0, edit);

    expect(serverUpdateRecord).toHaveBeenCalledWith(0, edit);
    expect(
      [...store.getState().records[0].values].sort(
        (x, y) => x.fieldIndex - y.fieldIndex,
      ),
    ).toEqual([
      { fieldIndex: 0, value: 'a-edited' },
      { fieldIndex: 1, value: 'b-value' },
      { fieldIndex: 2, value: 'c-value' },
    ]);
  });
});
