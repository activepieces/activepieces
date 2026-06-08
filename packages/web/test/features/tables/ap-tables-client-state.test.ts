// @vitest-environment jsdom
import { FieldType, TableAutomationStatus } from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { createApTableStore } from '@/features/tables';

const makeTable = (id: string, name: string) => ({
  id,
  projectId: 'project-1',
  name,
  created: '2026-01-01T00:00:00.000Z',
  updated: '2026-01-01T00:00:00.000Z',
  status: TableAutomationStatus.DISABLED,
  externalId: null,
  folderId: null,
});

const makeField = (id: string, name: string) => ({
  id,
  tableId: 'table-1',
  name,
  type: FieldType.TEXT,
  created: '2026-01-01T00:00:00.000Z',
  updated: '2026-01-01T00:00:00.000Z',
  externalId: null,
});

const makeRecord = (id: string, fieldId: string, value: string) => ({
  id,
  projectId: 'project-1',
  tableId: 'table-1',
  created: '2026-01-01T00:00:00.000Z',
  updated: '2026-01-01T00:00:00.000Z',
  cells: {
    [fieldId]: { value },
  },
});

describe('createApTableStore.replaceFromServer', () => {
  it('replaces the internal server snapshot used by later record updates', () => {
    const oldField = makeField('field-old', 'Old');
    const oldRecord = makeRecord('record-old', 'field-old', 'before');
    const store = createApTableStore(
      makeTable('table-1', 'Old Table') as any,
      [oldField] as any,
      [oldRecord] as any,
    );

    const newField = makeField('field-new', 'New');
    const newRecord = makeRecord('record-new', 'field-new', 'after');

    store.getState().replaceFromServer({
      table: makeTable('table-1', 'New Table') as any,
      fields: [newField] as any,
      records: [newRecord] as any,
    });

    store.getState().setRecords([newRecord] as any);

    expect(store.getState().table.name).toBe('New Table');
    expect(store.getState().serverFields[0].id).toBe('field-new');
    expect(store.getState().records[0].values[0].fieldIndex).toBe(0);
  });
});
