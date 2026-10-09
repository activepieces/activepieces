import {
  Field,
  FieldType,
  PopulatedRecord,
  Table,
  TableAutomationStatus,
} from '@activepieces/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createApTableStore } from '@/features/tables/stores/store/ap-tables-client-state';

const api = vi.hoisted(() => ({
  deleteRecords: vi.fn(),
  deleteField: vi.fn(),
  updateRecord: vi.fn(),
}));

vi.mock('@/features/tables/api/records-api', () => ({
  recordsApi: { delete: api.deleteRecords, update: api.updateRecord },
}));
vi.mock('@/features/tables/api/fields-api', () => ({
  fieldsApi: { delete: api.deleteField },
}));
vi.mock('@/features/tables/api/tables-api', () => ({ tablesApi: {} }));

function createStore() {
  return createApTableStore(table, fields, records);
}

describe('table mutation failure recovery', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    api.deleteRecords.mockResolvedValue(undefined);
    api.deleteField.mockResolvedValue(undefined);
    api.updateRecord.mockResolvedValue(records[1]);
  });

  it.each(['record', 'field'])(
    'stops queued and subsequent edits after a failed %s deletion',
    async (entity) => {
      let rejectDelete: (error: Error) => void = () => undefined;
      const deletion = new Promise<void>((_resolve, reject) => {
        rejectDelete = reject;
      });
      const deleteApi =
        entity === 'record' ? api.deleteRecords : api.deleteField;
      deleteApi.mockReturnValueOnce(deletion);
      const store = createStore();

      if (entity === 'record') {
        store.getState().deleteRecords(['0']);
      } else {
        store.getState().deleteField(0);
      }
      store.getState().updateRecord(0, {
        values: [{ fieldIndex: 0, value: 'queued edit' }],
      });
      await vi.waitFor(() => expect(deleteApi).toHaveBeenCalledTimes(1));

      rejectDelete(new Error('Network unavailable'));
      await vi.waitFor(() => expect(store.getState().hasSaveError).toBe(true));
      store.getState().updateRecord(0, {
        values: [{ fieldIndex: 0, value: 'later edit' }],
      });
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(api.updateRecord).not.toHaveBeenCalled();
      expect(store.getState().isSaving).toBe(false);

      const recoveredStore = createStore();
      recoveredStore.getState().updateRecord(1, {
        values: [{ fieldIndex: 1, value: 'recovered edit' }],
      });
      await vi.waitFor(() => expect(api.updateRecord).toHaveBeenCalledTimes(1));
      expect(api.updateRecord).toHaveBeenCalledWith('bob', {
        tableId: table.id,
        cells: [{ fieldId: 'email', value: 'recovered edit' }],
      });
      expect(recoveredStore.getState().hasSaveError).toBe(false);
    },
  );

  it('edits the surviving record after a successful deletion', async () => {
    const store = createStore();
    store.getState().deleteRecords(['0']);
    store.getState().updateRecord(0, {
      values: [{ fieldIndex: 0, value: 'Robert' }],
    });

    await vi.waitFor(() => expect(api.updateRecord).toHaveBeenCalledTimes(1));
    expect(api.deleteRecords).toHaveBeenCalledWith({
      tableId: table.id,
      ids: ['alice'],
    });
    expect(api.updateRecord).toHaveBeenCalledWith('bob', {
      tableId: table.id,
      cells: [{ fieldId: 'name', value: 'Robert' }],
    });
    expect(store.getState().hasSaveError).toBe(false);
    expect(store.getState().isSaving).toBe(false);
  });

  it('preserves surviving cell values and field IDs after a successful middle-field deletion', async () => {
    const store = createStore();
    store.getState().deleteField(1);
    expect(store.getState().records[1].values).toEqual([
      { fieldIndex: 0, value: 'Bob' },
      { fieldIndex: 1, value: 'Paris' },
    ]);
    store.getState().updateRecord(1, {
      values: [{ fieldIndex: 1, value: 'London' }],
    });

    await vi.waitFor(() => expect(api.updateRecord).toHaveBeenCalledTimes(1));
    expect(api.deleteField).toHaveBeenCalledWith('email');
    expect(api.updateRecord).toHaveBeenCalledWith('bob', {
      tableId: table.id,
      cells: [{ fieldId: 'city', value: 'London' }],
    });
    expect(store.getState().records[1].values).toEqual([
      { fieldIndex: 0, value: 'Bob' },
      { fieldIndex: 1, value: 'London' },
    ]);
  });
});

const table: Table = {
  id: 'table-1',
  created: '2026-10-09T00:00:00.000Z',
  updated: '2026-10-09T00:00:00.000Z',
  name: 'Contacts',
  projectId: 'project-1',
  externalId: 'contacts',
  status: TableAutomationStatus.ENABLED,
  trigger: null,
};

const fields: Field[] = ['name', 'email', 'city'].map((id, position) => ({
  id,
  created: table.created,
  updated: table.updated,
  name: id,
  externalId: id,
  type: FieldType.TEXT,
  tableId: table.id,
  projectId: table.projectId,
  position,
}));

const records: PopulatedRecord[] = [
  { id: 'alice', values: ['Alice', 'alice@example.com', 'Berlin'] },
  { id: 'bob', values: ['Bob', 'bob@example.com', 'Paris'] },
].map(({ id, values }) => ({
  id,
  created: table.created,
  updated: table.updated,
  tableId: table.id,
  projectId: table.projectId,
  cells: Object.fromEntries(
    fields.map((field, index) => [
      field.id,
      {
        created: table.created,
        updated: table.updated,
        fieldName: field.name,
        value: values[index],
      },
    ]),
  ),
}));
