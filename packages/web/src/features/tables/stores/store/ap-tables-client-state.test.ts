import {
  Field,
  FieldType,
  PopulatedRecord,
  Table,
  TableAutomationStatus,
} from '@activepieces/shared';
import { describe, expect, it, vi } from 'vitest';

import { createApTableStore } from './ap-tables-client-state';

vi.mock('../../api/fields-api', () => ({ fieldsApi: {} }));
vi.mock('../../api/records-api', () => ({ recordsApi: {} }));
vi.mock('../../api/tables-api', () => ({ tablesApi: {} }));
vi.mock('@/lib/error-reporting', () => ({ errorReporting: {} }));

describe('mergeServerRecords', () => {
  it('updates and adds rows by record id, keeping row identity and selection', () => {
    const store = createApTableStore(table, [nameField], [record('r1', 'a')]);
    const firstUuid = store.getState().records[0].uuid;
    store.getState().setSelectedCell({ rowIdx: 0, columnIdx: 1 });
    store.getState().setSelectedRecords(new Set([firstUuid]));

    store.getState().mergeServerRecords({
      records: [record('r2', 'c'), record('r1', 'b')],
      deletedIds: [],
    });

    const state = store.getState();
    expect(state.records.map((row) => row.values[0].value)).toEqual(['b', 'c']);
    expect(state.records[0].uuid).toBe(firstUuid);
    expect(state.serverRecords.map((row) => row.id)).toEqual(['r1', 'r2']);
    expect(state.selectedCell).toEqual({ rowIdx: 0, columnIdx: 1 });
    expect([...state.selectedRecords]).toEqual([firstUuid]);
  });

  it('removes deleted rows and moves the selection with its row', () => {
    const store = createApTableStore(
      table,
      [nameField],
      [record('r1', 'a'), record('r2', 'b')],
    );
    store.getState().setSelectedCell({ rowIdx: 1, columnIdx: 1 });

    store.getState().mergeServerRecords({ records: [], deletedIds: ['r1'] });

    const state = store.getState();
    expect(state.serverRecords.map((row) => row.id)).toEqual(['r2']);
    expect(state.records.map((row) => row.values[0].value)).toEqual(['b']);
    expect(state.selectedCell).toEqual({ rowIdx: 0, columnIdx: 1 });

    store.getState().mergeServerRecords({ records: [], deletedIds: ['r2'] });
    expect(store.getState().selectedCell).toBeNull();
  });
});

function record(id: string, value: string): PopulatedRecord {
  return {
    id,
    created: '',
    updated: '',
    tableId: table.id,
    projectId: table.projectId,
    cells: {
      f1: { fieldName: 'Name', value, updated: '', created: '' },
    },
  };
}

const table: Table = {
  id: 't1',
  created: '',
  updated: '',
  name: 'Leads',
  projectId: 'p1',
  externalId: 'e1',
  status: TableAutomationStatus.DISABLED,
  trigger: null,
};

const nameField: Field = {
  id: 'f1',
  created: '',
  updated: '',
  name: 'Name',
  type: FieldType.TEXT,
  tableId: 't1',
  projectId: 'p1',
  externalId: 'x1',
  position: 0,
};
