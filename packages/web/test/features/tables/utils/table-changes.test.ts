import { Field, FieldType, PopulatedRecord } from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { tableChanges } from '@/features/tables/utils/table-changes';

describe('tableChanges.recordKeys', () => {
  it('lights a whole row when it is new and only the changed cells otherwise', () => {
    const before = [record({ id: 'r1', cells: { f1: 'Ada', f2: 'Paris' } })];
    const records = [
      record({ id: 'r1', cells: { f1: 'Ada', f2: 'Rome' } }),
      record({ id: 'r2', cells: { f1: 'Bob' } }),
    ];

    expect(tableChanges.recordKeys({ before, records })).toEqual([
      'table-cell:r1:f2',
      'table-row:r2',
    ]);
  });

  it('lights a cell that gained a value', () => {
    const before = [record({ id: 'r1', cells: { f1: 'Ada' } })];
    const records = [record({ id: 'r1', cells: { f1: 'Ada', f2: 'Rome' } })];

    expect(tableChanges.recordKeys({ before, records })).toEqual([
      'table-cell:r1:f2',
    ]);
  });
});

describe('tableChanges.fieldKeys', () => {
  it('lights new, renamed and retyped columns, not untouched ones', () => {
    const before = [
      field({ id: 'f1', name: 'Name' }),
      field({ id: 'f2', name: 'City' }),
      field({ id: 'f3', name: 'Age' }),
    ];
    const fields = [
      field({ id: 'f1', name: 'Name' }),
      field({ id: 'f2', name: 'Town' }),
      field({ id: 'f3', name: 'Age', type: FieldType.NUMBER }),
      field({ id: 'f4', name: 'Email' }),
    ];

    expect(tableChanges.fieldKeys({ before, fields })).toEqual([
      'table-field:f2',
      'table-field:f3',
      'table-field:f4',
    ]);
  });
});

describe('tableChanges.parse', () => {
  it('reads back the row, cell and column it lit, and ignores other keys', () => {
    expect(tableChanges.parse('table-row:r1')).toEqual({
      type: 'row',
      recordId: 'r1',
    });
    expect(tableChanges.parse('table-cell:r1:f2')).toEqual({
      type: 'cell',
      recordId: 'r1',
      fieldId: 'f2',
    });
    expect(tableChanges.parse('table-field:f2')).toEqual({
      type: 'field',
      fieldId: 'f2',
    });
    expect(tableChanges.parse('flow-step:step_1')).toBeNull();
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
    tableId: 't1',
    projectId: 'p1',
    cells: Object.fromEntries(
      Object.entries(cells).map(([fieldId, value]) => [
        fieldId,
        { fieldName: fieldId, value, updated: '', created: '' },
      ])
    ),
  };
}

function field({
  id,
  name,
  type = FieldType.TEXT,
}: {
  id: string;
  name: string;
  type?: FieldType.TEXT | FieldType.NUMBER;
}): Field {
  return {
    id,
    created: '',
    updated: '',
    name,
    type,
    tableId: 't1',
    projectId: 'p1',
    externalId: `x-${id}`,
    position: 0,
  };
}
