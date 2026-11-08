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

describe('createApTableStore', () => {
  it('starts with no selected cell', () => {
    const store = createApTableStore(table, [nameField], [record('r1', 'a')]);
    expect(store.getState().selectedCell).toBeNull();
  });

  it('merges server changes without replacing row identity or selection', () => {
    const store = createApTableStore(table, [nameField], [record('r1', 'a')]);
    const firstUuid = store.getState().records[0].uuid;
    store.getState().setSelectedCell({ rowIdx: 0, columnIdx: 1 });
    store.getState().setSelectedRecords(new Set([firstUuid]));

    store.getState().syncFromServer({
      table: { ...table, name: 'Renamed' },
      fields: [nameField, emailField],
      records: [record('r1', 'b'), record('r2', 'c')],
    });

    const state = store.getState();
    expect(state.records[0].uuid).toBe(firstUuid);
    expect(state.records[0].values[0].value).toBe('b');
    expect(state.records).toHaveLength(2);
    expect(state.fields.map((field) => field.uuid)).toEqual(['f1', 'f2']);
    expect(state.selectedCell).toEqual({ rowIdx: 0, columnIdx: 1 });
    expect([...state.selectedRecords]).toEqual([firstUuid]);
    expect(state.table.name).toBe('Renamed');
    expect(state.serverRecords.map((r) => r.id)).toEqual(['r1', 'r2']);
  });

  it('drops a selection that no longer exists after a merge', () => {
    const store = createApTableStore(
      table,
      [nameField],
      [record('r1', 'a'), record('r2', 'b')],
    );
    store.getState().setSelectedCell({ rowIdx: 1, columnIdx: 1 });
    store.getState().syncFromServer({
      table,
      fields: [nameField],
      records: [record('r1', 'a')],
    });
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
      f1: {
        fieldName: 'Name',
        value,
        updated: '',
        created: '',
      },
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
};

const emailField: Field = { ...nameField, id: 'f2', name: 'Email' };
