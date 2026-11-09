import {
  Field,
  FieldType,
  PopulatedRecord,
  Table,
  TableAutomationStatus,
} from '@activepieces/shared';
import { describe, expect, it, vi } from 'vitest';

import { createApTableStore } from '@/features/tables/stores/store/ap-tables-client-state';

vi.mock('@/features/tables/api/fields-api', () => ({ fieldsApi: {} }));
vi.mock('@/features/tables/api/records-api', () => ({ recordsApi: {} }));
vi.mock('@/features/tables/api/tables-api', () => ({ tablesApi: {} }));
vi.mock('@/lib/error-reporting', () => ({ errorReporting: {} }));

describe('mergeServerFields', () => {
  it('adds and renames columns while each cell keeps its value', () => {
    const store = createApTableStore(
      table,
      [field({ id: 'f1', name: 'Name' }), field({ id: 'f2', name: 'City' })],
      [record({ id: 'r1', cells: { f1: 'Ada', f2: 'Paris' } })]
    );
    const columnKeys = store.getState().fields.map((column) => column.uuid);

    store
      .getState()
      .mergeServerFields([
        field({ id: 'f1', name: 'Name' }),
        field({ id: 'f2', name: 'Town' }),
        field({ id: 'f3', name: 'Email' }),
      ]);

    const state = store.getState();
    expect(state.fields.map((column) => column.name)).toEqual([
      'Name',
      'Town',
      'Email',
    ]);
    expect(state.fields.map((column) => column.uuid)).toEqual([
      ...columnKeys,
      'f3',
    ]);
    expect(state.records[0].values).toEqual([
      { fieldIndex: 0, value: 'Ada' },
      { fieldIndex: 1, value: 'Paris' },
    ]);
    expect(state.serverFields.map((column) => column.id)).toEqual([
      'f1',
      'f2',
      'f3',
    ]);
  });

  it('drops a removed column and moves the cells after it', () => {
    const store = createApTableStore(
      table,
      [field({ id: 'f1', name: 'Name' }), field({ id: 'f2', name: 'City' })],
      [record({ id: 'r1', cells: { f1: 'Ada', f2: 'Paris' } })]
    );

    store.getState().mergeServerFields([field({ id: 'f2', name: 'City' })]);

    const state = store.getState();
    expect(state.fields.map((column) => column.name)).toEqual(['City']);
    expect(state.records[0].values).toEqual([
      { fieldIndex: 0, value: 'Paris' },
    ]);
  });
});

function record({
  id,
  cells,
}: {
  id: string;
  cells: Record<string, string>;
}): PopulatedRecord {
  return {
    id,
    created: '',
    updated: '',
    tableId: table.id,
    projectId: table.projectId,
    cells: Object.fromEntries(
      Object.entries(cells).map(([fieldId, value]) => [
        fieldId,
        { fieldName: fieldId, value, updated: '', created: '' },
      ])
    ),
  };
}

function field({ id, name }: { id: string; name: string }): Field {
  return {
    id,
    created: '',
    updated: '',
    name,
    type: FieldType.TEXT,
    tableId: table.id,
    projectId: table.projectId,
    externalId: `x-${id}`,
    position: 0,
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
