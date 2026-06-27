import {
  Field,
  FieldType,
  PopulatedRecord,
  Table,
  TableAutomationStatus,
  TableAutomationTrigger,
} from '@activepieces/shared';
import { describe, expect, it, vi } from 'vitest';

// The store transitively imports the table API clients, which read
// window.location at module load. applyServerDelta never calls them, so stub
// the modules to keep this a pure node-env unit test.
vi.mock('@/features/tables/api/fields-api', () => ({ fieldsApi: {} }));
vi.mock('@/features/tables/api/records-api', () => ({ recordsApi: {} }));
vi.mock('@/features/tables/api/tables-api', () => ({ tablesApi: {} }));

import { createApTableStore } from '@/features/tables/stores/store/ap-tables-client-state';

describe('ap-tables-client-state applyServerDelta', () => {
  it('appends a server-created record keyed by recordId and flags it changed', () => {
    const store = createApTableStore(table(), [fieldA, fieldB], []);

    store.getState().applyServerDelta({
      kind: 'record-created',
      record: record('rec1', { [fieldA.id]: 'hello', [fieldB.id]: '42' }),
    });

    const state = store.getState();
    expect(state.records).toHaveLength(1);
    expect(state.records[0].recordId).toBe('rec1');
    expect(valueAt(state.records[0], 0)).toBe('hello');
    expect(valueAt(state.records[0], 1)).toBe('42');
    expect(state.recentlyChanged.records['rec1']).toBeGreaterThan(Date.now());
  });

  it('is idempotent: a duplicate create upserts rather than duplicates', () => {
    const store = createApTableStore(table(), [fieldA, fieldB], []);
    const delta = {
      kind: 'record-created' as const,
      record: record('rec1', { [fieldA.id]: 'hello' }),
    };

    store.getState().applyServerDelta(delta);
    store.getState().applyServerDelta({
      kind: 'record-updated',
      record: record('rec1', { [fieldA.id]: 'world' }),
    });

    const state = store.getState();
    expect(state.records).toHaveLength(1);
    expect(valueAt(state.records[0], 0)).toBe('world');
  });

  it('removes a record on delete and clears its highlight', () => {
    const store = createApTableStore(table(), [fieldA, fieldB], [
      record('rec1', { [fieldA.id]: 'hello' }),
    ]);

    store.getState().applyServerDelta({ kind: 'record-deleted', recordId: 'rec1' });

    const state = store.getState();
    expect(state.records).toHaveLength(0);
    expect(state.recentlyChanged.records['rec1']).toBeUndefined();
  });

  it('field-created appends a field and an empty cell to every record', () => {
    const store = createApTableStore(table(), [fieldA], [
      record('rec1', { [fieldA.id]: 'hello' }),
    ]);

    store.getState().applyServerDelta({ kind: 'field-created', field: fieldB });

    const state = store.getState();
    expect(state.fields.map((f) => f.uuid)).toEqual([fieldA.id, fieldB.id]);
    expect(valueAt(state.records[0], 1)).toBe('');
  });

  it('field-deleted re-indexes remaining cells so positions stay aligned', () => {
    const store = createApTableStore(table(), [fieldA, fieldB], [
      record('rec1', { [fieldA.id]: 'first', [fieldB.id]: 'second' }),
    ]);

    store.getState().applyServerDelta({ kind: 'field-deleted', fieldId: fieldA.id });

    const state = store.getState();
    expect(state.fields.map((f) => f.uuid)).toEqual([fieldB.id]);
    // fieldB used to be at index 1; after removing index 0 it must shift to 0.
    expect(valueAt(state.records[0], 0)).toBe('second');
    expect(state.records[0].values).toHaveLength(1);
  });
});

function valueAt(record: { values: { fieldIndex: number; value: unknown }[] }, fieldIndex: number) {
  return record.values.find((v) => v.fieldIndex === fieldIndex)?.value;
}

function table(): Table {
  return {
    id: 'tbl1',
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    name: 'Test',
    folderId: null,
    projectId: 'proj1',
    externalId: 'ext-tbl1',
    status: TableAutomationStatus.ENABLED,
    trigger: TableAutomationTrigger.ON_NEW_RECORD,
  };
}

function record(id: string, values: Record<string, string>): PopulatedRecord {
  return {
    id,
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    tableId: 'tbl1',
    projectId: 'proj1',
    cells: Object.fromEntries(
      Object.entries(values).map(([fieldId, value]) => [
        fieldId,
        {
          fieldName: fieldId,
          value,
          created: '2026-01-01T00:00:00.000Z',
          updated: '2026-01-01T00:00:00.000Z',
        },
      ]),
    ),
  };
}

const fieldA: Field = {
  id: 'fieldA',
  created: '2026-01-01T00:00:00.000Z',
  updated: '2026-01-01T00:00:00.000Z',
  name: 'A',
  externalId: 'ext-A',
  type: FieldType.TEXT,
  tableId: 'tbl1',
  projectId: 'proj1',
};

const fieldB: Field = {
  id: 'fieldB',
  created: '2026-01-01T00:00:00.000Z',
  updated: '2026-01-01T00:00:00.000Z',
  name: 'B',
  externalId: 'ext-B',
  type: FieldType.NUMBER,
  tableId: 'tbl1',
  projectId: 'proj1',
};
