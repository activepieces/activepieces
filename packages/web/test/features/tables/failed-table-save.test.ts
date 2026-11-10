// @vitest-environment jsdom
import {
  Field,
  FieldType,
  PopulatedRecord,
  Table,
  TableAutomationStatus,
} from '@activepieces/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createApTableStore } from '@/features/tables/stores/store/ap-tables-client-state';

const recordsApiMock = vi.hoisted(() => ({
  delete: vi.fn(),
  update: vi.fn(),
}));
const fieldsApiMock = vi.hoisted(() => ({ delete: vi.fn() }));

vi.mock('@/features/tables/api/records-api', () => ({
  recordsApi: recordsApiMock,
}));

vi.mock('@/features/tables/api/fields-api', () => ({
  fieldsApi: fieldsApiMock,
}));

vi.mock('@/lib/error-reporting', () => ({
  errorReporting: { report: vi.fn() },
}));

const table: Table = {
  id: 'table-1',
  created: '2026-11-10T00:00:00.000Z',
  updated: '2026-11-10T00:00:00.000Z',
  name: 'People',
  projectId: 'project-1',
  externalId: 'table-1',
  status: TableAutomationStatus.ENABLED,
  trigger: null,
};

const field = (id: string, position: number): Field => ({
  id,
  created: table.created,
  updated: table.updated,
  name: id,
  externalId: id,
  type: FieldType.TEXT,
  tableId: table.id,
  projectId: table.projectId,
  position,
});

const record = (id: string, values: string[]): PopulatedRecord => ({
  id,
  created: table.created,
  updated: table.updated,
  tableId: table.id,
  projectId: table.projectId,
  cells: Object.fromEntries(
    values.map((value, index) => [
      fields[index].id,
      {
        created: table.created,
        updated: table.updated,
        value,
        fieldName: fields[index].name,
      },
    ]),
  ),
});

const fields = [field('name', 0), field('email', 1), field('phone', 2)];

const createStore = (onSaveFailed: () => void = vi.fn()) =>
  createApTableStore({
    table,
    fields,
    records: [
      record('alice-id', ['Alice', 'alice@example.com', '111']),
      record('bob-id', ['Bob', 'bob@example.com', '222']),
    ],
    onSaveFailed,
  });

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const deferred = () => {
  let reject: (error: Error) => void = () => undefined;
  const promise = new Promise<void>((_, rej) => {
    reject = rej;
  });
  return { promise, reject };
};

describe('table edits after a failed save', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recordsApiMock.update.mockImplementation(async (id: string) =>
      record(id, ['x', 'x', 'x']),
    );
  });

  it('sends no update after a rejected row delete, including an edit queued while it was pending', async () => {
    const pendingDelete = deferred();
    recordsApiMock.delete.mockReturnValue(pendingDelete.promise);
    const onSaveFailed = vi.fn();
    const store = createStore(onSaveFailed);

    store.getState().deleteRecords(['0']);
    store
      .getState()
      .updateRecord(0, { values: [{ fieldIndex: 0, value: 'Robert' }] });
    pendingDelete.reject(new Error('500'));
    await flush();
    store
      .getState()
      .updateRecord(0, { values: [{ fieldIndex: 0, value: 'Rob' }] });
    await flush();

    expect(recordsApiMock.update).not.toHaveBeenCalled();
    expect(onSaveFailed).toHaveBeenCalledTimes(1);
    expect(store.getState().isSaving).toBe(false);
  });

  it('sends no update after a rejected field delete', async () => {
    fieldsApiMock.delete.mockRejectedValue(new Error('500'));
    const onSaveFailed = vi.fn();
    const store = createStore(onSaveFailed);

    store.getState().deleteField(0);
    store.getState().updateRecord(0, {
      values: [{ fieldIndex: 0, value: 'alice+updated@example.com' }],
    });
    await flush();

    expect(recordsApiMock.update).not.toHaveBeenCalled();
    expect(onSaveFailed).toHaveBeenCalledTimes(1);
  });

  it('sends a later edit to the right record after a successful row delete', async () => {
    recordsApiMock.delete.mockResolvedValue(undefined);
    const store = createStore();

    store.getState().deleteRecords(['0']);
    store
      .getState()
      .updateRecord(0, { values: [{ fieldIndex: 0, value: 'Robert' }] });
    await flush();

    expect(recordsApiMock.update).toHaveBeenCalledWith('bob-id', {
      tableId: table.id,
      cells: [{ fieldId: 'name', value: 'Robert' }],
    });
  });

  it('sends a later edit to the right field after a successful middle field delete', async () => {
    fieldsApiMock.delete.mockResolvedValue(undefined);
    const store = createStore();

    store.getState().deleteField(1);
    store
      .getState()
      .updateRecord(0, { values: [{ fieldIndex: 1, value: '999' }] });
    await flush();

    expect(store.getState().records[0].values).toEqual([
      { fieldIndex: 0, value: 'Alice' },
      { fieldIndex: 1, value: '999' },
    ]);
    expect(recordsApiMock.update).toHaveBeenCalledWith('alice-id', {
      tableId: table.id,
      cells: [{ fieldId: 'phone', value: '999' }],
    });
  });
});
