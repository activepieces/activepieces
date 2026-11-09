import {
  Field,
  FieldType,
  PopulatedRecord,
  Table,
  TableAutomationStatus,
} from '@activepieces/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { recordsApi } from '@/features/tables/api/records-api';
import { createApTableStore } from '@/features/tables/stores/store/ap-tables-client-state';
import { tableSyncClock } from '@/features/tables/stores/store/table-sync-clock';

vi.mock('@/features/tables/api/records-api', () => ({
  recordsApi: { update: vi.fn(), delete: vi.fn() },
}));
vi.mock('@/features/tables/api/fields-api', () => ({
  fieldsApi: { delete: vi.fn(async () => undefined), update: vi.fn() },
}));
vi.mock('@/features/tables/api/tables-api', () => ({ tablesApi: {} }));
vi.mock('@/lib/error-reporting', () => ({
  errorReporting: { report: vi.fn() },
}));

describe('table live sync', () => {
  beforeEach(() => {
    vi.mocked(recordsApi.update).mockReset();
    vi.mocked(recordsApi.delete).mockReset();
  });

  it('applies a live update to the right row after a failed delete', async () => {
    vi.mocked(recordsApi.delete).mockRejectedValue(new Error('offline'));
    const store = createApTableStore(
      table,
      [nameField],
      [record('r1', 'a'), record('r2', 'b'), record('r3', 'c')],
    );

    store.getState().deleteRecords(['0']);
    await store.getState().waitForSaves();
    store.getState().applyRecordChanges({
      records: [record('r2', 'b2')],
      removedIds: [],
      since: tableSyncClock.tick(),
    });

    expect(values(store.getState())).toEqual(['b2', 'c']);
  });

  it('updates, adds and removes rows by record id, keeping row identity and selection', () => {
    const store = createApTableStore(
      table,
      [nameField],
      [record('r1', 'a'), record('r2', 'b')],
    );
    const firstRow = store.getState().records[0].uuid;
    store.getState().setSelectedCell({ rowIdx: 0, columnIdx: 1 });
    store.getState().setSelectedRecords(new Set([firstRow]));

    const rowIds = store.getState().applyServerRecords({
      records: [record('r3', 'c'), record('r1', 'a2')],
      since: tableSyncClock.tick(),
    });

    const state = store.getState();
    expect(values(state)).toEqual(['a2', 'c']);
    expect(state.records[0].uuid).toBe(firstRow);
    expect(state.getServerRecords().map((row) => row.id)).toEqual(['r1', 'r3']);
    expect(rowIds.get('r1')).toBe(firstRow);
    expect(rowIds.get('r3')).toBe(state.records[1].uuid);
    expect(rowIds.has('r2')).toBe(false);
    expect(state.selectedCell).toEqual({ rowIdx: 0, columnIdx: 1 });
    expect([...state.selectedRecords]).toEqual([firstRow]);
  });

  it('keeps a newer local edit when an older value arrives', async () => {
    const store = createApTableStore(table, [nameField], [record('r1', '1')]);
    const staleSince = tableSyncClock.tick();
    vi.mocked(recordsApi.update).mockResolvedValue(record('r1', '2'));

    store
      .getState()
      .updateRecord(0, { values: [{ fieldIndex: 0, value: '2' }] });
    await store.getState().waitForSaves();
    store.getState().applyServerRecords({
      records: [record('r1', '1')],
      since: staleSince,
    });

    expect(values(store.getState())).toEqual(['2']);
  });

  it('applies a value fetched after the local save', async () => {
    const store = createApTableStore(table, [nameField], [record('r1', '1')]);
    vi.mocked(recordsApi.update).mockResolvedValue(record('r1', '2'));

    store
      .getState()
      .updateRecord(0, { values: [{ fieldIndex: 0, value: '2' }] });
    await store.getState().waitForSaves();
    store.getState().applyServerRecords({
      records: [record('r1', '3')],
      since: tableSyncClock.tick(),
    });

    expect(values(store.getState())).toEqual(['3']);
  });

  it('keeps a local save that finished after a change event arrived', async () => {
    const store = createApTableStore(table, [nameField], [record('r1', '1')]);
    const eventSince = tableSyncClock.tick();
    vi.mocked(recordsApi.update).mockResolvedValue(record('r1', '2'));

    store
      .getState()
      .updateRecord(0, { values: [{ fieldIndex: 0, value: '2' }] });
    await store.getState().waitForSaves();
    const rowIds = store.getState().applyRecordChanges({
      records: [record('r1', 'from the chat')],
      removedIds: [],
      since: eventSince,
    });

    expect(values(store.getState())).toEqual(['2']);
    expect(rowIds.size).toBe(0);
  });

  it('does not let an older snapshot undo a change event', () => {
    const store = createApTableStore(table, [nameField], [record('r1', 'a')]);
    const snapshotSince = tableSyncClock.tick();

    store.getState().applyRecordChanges({
      records: [record('r1', 'from the chat'), record('r2', 'new')],
      removedIds: [],
      since: tableSyncClock.tick(),
    });
    store.getState().applyServerRecords({
      records: [record('r1', 'a')],
      since: snapshotSince,
    });

    expect(values(store.getState())).toEqual(['from the chat', 'new']);
  });

  it('keeps the other cells of a remote update when a local save finishes after it', async () => {
    const store = createApTableStore(
      table,
      [nameField, emailField],
      [contact({ name: 'a', email: 'b', updated: T1 })],
    );
    const eventSince = tableSyncClock.tick();
    vi.mocked(recordsApi.update).mockResolvedValue(
      contact({ name: 'mine', email: 'remote', updated: T3 }),
    );

    store
      .getState()
      .updateRecord(0, { values: [{ fieldIndex: 0, value: 'mine' }] });
    await store.getState().waitForSaves();
    store.getState().applyRecordChanges({
      records: [contact({ name: 'a', email: 'remote', updated: T2 })],
      removedIds: [],
      since: eventSince,
    });

    expect(cells(store.getState())).toEqual([['mine', 'remote']]);
  });

  it('applies a remote update the server made after the local save, even when it arrived first', async () => {
    const store = createApTableStore(
      table,
      [nameField, emailField],
      [contact({ name: 'a', email: 'b', updated: T1 })],
    );
    const eventSince = tableSyncClock.tick();
    vi.mocked(recordsApi.update).mockResolvedValue(
      contact({ name: 'mine', email: 'b', updated: T2 }),
    );

    store
      .getState()
      .updateRecord(0, { values: [{ fieldIndex: 0, value: 'mine' }] });
    await store.getState().waitForSaves();
    const rowIds = store.getState().applyRecordChanges({
      records: [contact({ name: 'mine', email: 'remote', updated: T3 })],
      removedIds: [],
      since: eventSince,
    });

    expect(cells(store.getState())).toEqual([['mine', 'remote']]);
    expect(rowIds.has('r1')).toBe(true);
  });

  it('changes only the rows a change event names', () => {
    const store = createApTableStore(
      table,
      [nameField],
      [record('r1', 'a'), record('r2', 'b'), record('r3', 'c')],
    );

    store.getState().applyRecordChanges({
      records: [record('r2', 'b2')],
      removedIds: ['r1'],
      since: tableSyncClock.tick(),
    });

    expect(values(store.getState())).toEqual(['b2', 'c']);
  });

  it('keeps the untouched records as they are when a change event arrives', () => {
    const store = createApTableStore(
      table,
      [nameField],
      [record('r1', 'a'), record('r2', 'b')],
    );
    const untouched = store.getState().getServerRecords()[1];

    store.getState().applyRecordChanges({
      records: [record('r1', 'a2')],
      removedIds: [],
      since: tableSyncClock.tick(),
    });

    expect(store.getState().getServerRecords()[1]).toBe(untouched);
  });

  it('reads the current server rows after a CSV import or a field delete', async () => {
    const store = createApTableStore(table, [nameField], [record('r1', 'a')]);

    store.getState().setRecords([record('r1', 'a'), record('r2', 'b')]);
    expect(
      store
        .getState()
        .getServerRecords()
        .map((row) => row.id),
    ).toEqual(['r1', 'r2']);

    store.getState().deleteField(0);
    await store.getState().waitForSaves();
    expect(
      store
        .getState()
        .getServerRecords()
        .map((row) => row.cells),
    ).toEqual([{}, {}]);
  });

  it('picks up a field the chat added and keeps the rows', () => {
    const store = createApTableStore(table, [nameField], [record('r1', 'a')]);
    const row = store.getState().records[0].uuid;

    store.getState().applyServerFields({
      fields: [
        nameField,
        { ...nameField, id: 'f2', name: 'Email', position: 1 },
      ],
      since: tableSyncClock.tick(),
    });

    const state = store.getState();
    expect(state.fields.map((field) => field.name)).toEqual(['Name', 'Email']);
    expect(state.records[0].uuid).toBe(row);
    expect(values(state)).toEqual(['a']);
  });

  it('keeps a local field rename that saved after the fields were fetched', async () => {
    const store = createApTableStore(table, [nameField], []);
    const staleSince = tableSyncClock.tick();

    store.getState().renameField(0, 'Full name');
    await store.getState().waitForSaves();
    store
      .getState()
      .applyServerFields({ fields: [nameField], since: staleSince });

    expect(store.getState().fields.map((field) => field.name)).toEqual([
      'Full name',
    ]);
  });
});

function values(state: {
  records: { values: { value: unknown }[] }[];
}): unknown[] {
  return state.records.map((row) => row.values[0]?.value);
}

function cells(state: {
  records: { values: { fieldIndex: number; value: unknown }[] }[];
}): unknown[][] {
  return state.records.map((row) =>
    [...row.values]
      .sort((a, b) => a.fieldIndex - b.fieldIndex)
      .map((cell) => cell.value),
  );
}

function contact({
  name,
  email,
  updated,
}: {
  name: string;
  email: string;
  updated: string;
}): PopulatedRecord {
  return {
    id: 'r1',
    created: T1,
    updated,
    tableId: table.id,
    projectId: table.projectId,
    cells: {
      f1: { fieldName: 'Name', value: name, updated, created: T1 },
      f2: { fieldName: 'Email', value: email, updated, created: T1 },
    },
  };
}

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

const emailField: Field = {
  ...nameField,
  id: 'f2',
  name: 'Email',
  externalId: 'x2',
  position: 1,
};

const T1 = '2026-01-01T00:00:01.000Z';
const T2 = '2026-01-01T00:00:02.000Z';
const T3 = '2026-01-01T00:00:03.000Z';
