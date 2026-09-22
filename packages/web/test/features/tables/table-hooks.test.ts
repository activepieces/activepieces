/**
 * @vitest-environment jsdom
 */
import {
  FieldType,
  SharedTemplate,
  TableImportDataType,
  TableTemplate,
} from '@activepieces/shared';
import { describe, expect, it, vi } from 'vitest';

import { fieldsApi } from '@/features/tables/api/fields-api';
import { recordsApi } from '@/features/tables/api/records-api';
import { tablesApi } from '@/features/tables/api/tables-api';
import { tableHooks } from '@/features/tables/hooks/table-hooks';

vi.mock('@/features/tables/api/tables-api', () => ({
  tablesApi: { clear: vi.fn(), update: vi.fn(), getById: vi.fn() },
}));
vi.mock('@/features/tables/api/fields-api', () => ({
  fieldsApi: { list: vi.fn(), delete: vi.fn(), create: vi.fn() },
}));
vi.mock('@/features/tables/api/records-api', () => ({
  recordsApi: { create: vi.fn() },
}));

const tableTemplate: TableTemplate = {
  name: 'Contacts',
  externalId: 'contacts',
  status: null,
  trigger: null,
  fields: [
    { name: 'Email', type: FieldType.TEXT, externalId: 'email' },
    {
      name: 'Stage',
      type: FieldType.STATIC_DROPDOWN,
      externalId: 'stage',
      data: { options: [{ value: 'lead' }] },
    },
  ],
  data: {
    type: TableImportDataType.CSV,
    rows: [
      [
        { fieldId: 'email', value: 'ada@activepieces.com' },
        { fieldId: 'stage', value: 'lead' },
      ],
    ],
  },
};

const templateOf = (tables: unknown[]): SharedTemplate =>
  ({ tables } as SharedTemplate);

describe('importTableIntoExisting', () => {
  it.each([
    ['a file that is not a table template', [{ name: 'a flow template' }]],
    ['a file with no tables', []],
    ['a file with more than one table', [tableTemplate, tableTemplate]],
    [
      'a table whose field type does not exist',
      [
        {
          ...tableTemplate,
          fields: [{ ...tableTemplate.fields[0], type: 'TXT' }],
        },
      ],
    ],
    [
      'a dropdown field without options',
      [
        {
          ...tableTemplate,
          fields: [{ ...tableTemplate.fields[1], data: null }],
        },
      ],
    ],
  ])('keeps the table intact when importing %s', async (_name, tables) => {
    vi.clearAllMocks();
    vi.mocked(fieldsApi.list).mockResolvedValue([]);

    await expect(
      tableHooks.importTableIntoExisting({
        template: templateOf(tables),
        existingTableId: 'table-1',
      }),
    ).rejects.toThrow();

    expect(tablesApi.clear).not.toHaveBeenCalled();
    expect(fieldsApi.delete).not.toHaveBeenCalled();
    expect(tablesApi.update).not.toHaveBeenCalled();
  });

  it('replaces the table when the file is a table template', async () => {
    vi.clearAllMocks();
    vi.mocked(fieldsApi.list).mockResolvedValue([
      { id: 'old-field', externalId: 'email' },
      { id: 'new-field', externalId: 'stage' },
    ] as never);

    await tableHooks.importTableIntoExisting({
      template: templateOf([tableTemplate]),
      existingTableId: 'table-1',
    });

    expect(tablesApi.clear).toHaveBeenCalledWith('table-1');
    expect(fieldsApi.delete).toHaveBeenCalledWith('old-field');
    expect(tablesApi.update).toHaveBeenCalledWith('table-1', {
      name: 'Contacts',
    });
    expect(fieldsApi.create).toHaveBeenCalledWith({
      name: 'Email',
      type: FieldType.TEXT,
      externalId: 'email',
      tableId: 'table-1',
      position: 0,
    });
    expect(recordsApi.create).toHaveBeenCalledWith({
      tableId: 'table-1',
      records: [
        [
          { fieldId: 'old-field', value: 'ada@activepieces.com' },
          { fieldId: 'new-field', value: 'lead' },
        ],
      ],
    });
  });
});
