import { SharedTemplate, TemplateStatus, TemplateType } from '@activepieces/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { tablesApi, fieldsApi, recordsApi } = vi.hoisted(() => ({
  tablesApi: {
    clear: vi.fn(),
    update: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
  },
  fieldsApi: { list: vi.fn(), delete: vi.fn(), create: vi.fn() },
  recordsApi: { create: vi.fn() },
}));

vi.mock('@/features/tables/api/tables-api', () => ({ tablesApi }));
vi.mock('@/features/tables/api/fields-api', () => ({ fieldsApi }));
vi.mock('@/features/tables/api/records-api', () => ({ recordsApi }));
vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => 'project-1' },
}));

import { tableHooks } from '@/features/tables/hooks/table-hooks';

const wrapAsDialogDoes = (fileContent: unknown): SharedTemplate => {
  const parsedContent = JSON.parse(JSON.stringify(fileContent));
  return {
    name: 'anything',
    type: TemplateType.SHARED,
    summary: '',
    description: '',
    tags: [],
    blogUrl: null,
    metadata: null,
    author: '',
    categories: [],
    pieces: [],
    tables: [parsedContent],
    status: TemplateStatus.PUBLISHED,
  };
};

const flowTemplateFile = {
  name: 'Send a Slack message',
  description: 'A flow, not a table',
  trigger: { name: 'trigger', type: 'PIECE_TRIGGER' },
};

const exportedTableTemplate = {
  name: 'Customers',
  externalId: 'customers',
  fields: [{ name: 'Email', type: 'TEXT', externalId: 'email' }],
  data: {
    type: 'CSV',
    rows: [[{ fieldId: 'email', value: 'a@b.com' }]],
  },
};

const templateWithUnknownFieldType = {
  name: 'Customers',
  externalId: 'customers',
  fields: [{ name: 'Email', type: 'NOT_A_REAL_TYPE', externalId: 'email' }],
  data: { type: 'CSV', rows: [] },
};

const templateWithDropdownMissingData = {
  name: 'Customers',
  externalId: 'customers',
  fields: [
    { name: 'Plan', type: 'STATIC_DROPDOWN', externalId: 'plan', data: null },
  ],
  data: { type: 'CSV', rows: [] },
};

const handWrittenTemplate = {
  name: 'Customers',
  fields: [{ name: 'Email', type: 'TEXT', externalId: 'email' }],
  data: {
    rows: [[{ fieldId: 'email', value: 42 }]],
  },
};

const templateWithMalformedRows = {
  name: 'Customers',
  externalId: 'customers',
  fields: [{ name: 'Email', type: 'TEXT', externalId: 'email' }],
  data: {
    type: 'CSV',
    rows: [{ fieldId: 'email', value: 'a@b.com' }],
  },
};

const gitSyncTableState = {
  id: 'table-2',
  name: 'Leads',
  externalId: 'leads',
  fields: [{ name: 'Name', type: 'TEXT', externalId: 'name' }],
  status: null,
  trigger: null,
};

describe('tableHooks.importTableIntoExisting', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    tablesApi.clear.mockResolvedValue(undefined);
    tablesApi.update.mockResolvedValue(undefined);
    tablesApi.getById.mockResolvedValue({ id: 'existing-1' });
    fieldsApi.delete.mockResolvedValue(undefined);
    fieldsApi.create.mockResolvedValue(undefined);
    recordsApi.create.mockResolvedValue([]);
    fieldsApi.list
      .mockResolvedValueOnce([{ id: 'old-field-1', externalId: 'email' }])
      .mockResolvedValue([{ id: 'new-field-1', externalId: 'email' }]);
  });

  it('does not clear the table or delete fields when the file is not a table template', async () => {
    await tableHooks
      .importTableIntoExisting({
        template: wrapAsDialogDoes(flowTemplateFile),
        existingTableId: 'existing-1',
      })
      .catch(() => undefined);

    expect(tablesApi.clear).not.toHaveBeenCalled();
    expect(fieldsApi.delete).not.toHaveBeenCalled();
    expect(fieldsApi.list).not.toHaveBeenCalled();
    expect(tablesApi.update).not.toHaveBeenCalled();
  });

  it('rejects a file that is not a table template', async () => {
    await expect(
      tableHooks.importTableIntoExisting({
        template: wrapAsDialogDoes(flowTemplateFile),
        existingTableId: 'existing-1',
      }),
    ).rejects.toThrow('Template tables are not in a valid format');
  });

  it('does not clear the table when a field has a type the server rejects', async () => {
    await tableHooks
      .importTableIntoExisting({
        template: wrapAsDialogDoes(templateWithUnknownFieldType),
        existingTableId: 'existing-1',
      })
      .catch(() => undefined);

    expect(tablesApi.clear).not.toHaveBeenCalled();
    expect(fieldsApi.delete).not.toHaveBeenCalled();
  });

  it('does not clear the table when a dropdown field is missing its options', async () => {
    await tableHooks
      .importTableIntoExisting({
        template: wrapAsDialogDoes(templateWithDropdownMissingData),
        existingTableId: 'existing-1',
      })
      .catch(() => undefined);

    expect(tablesApi.clear).not.toHaveBeenCalled();
    expect(fieldsApi.delete).not.toHaveBeenCalled();
  });

  it('does not clear the table when data rows are not arrays of cells', async () => {
    await tableHooks
      .importTableIntoExisting({
        template: wrapAsDialogDoes(templateWithMalformedRows),
        existingTableId: 'existing-1',
      })
      .catch(() => undefined);

    expect(tablesApi.clear).not.toHaveBeenCalled();
    expect(fieldsApi.delete).not.toHaveBeenCalled();
  });

  it('imports an exported table template', async () => {
    await tableHooks.importTableIntoExisting({
      template: wrapAsDialogDoes(exportedTableTemplate),
      existingTableId: 'existing-1',
    });

    expect(tablesApi.clear).toHaveBeenCalledWith('existing-1');
    expect(fieldsApi.delete).toHaveBeenCalledWith('old-field-1');
    expect(tablesApi.update).toHaveBeenCalledWith('existing-1', {
      name: 'Customers',
    });
    expect(fieldsApi.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Email', tableId: 'existing-1', position: 0 }),
    );
    expect(recordsApi.create).toHaveBeenCalledWith({
      tableId: 'existing-1',
      records: [[{ fieldId: 'new-field-1', value: 'a@b.com' }]],
    });
  });

  it('imports a hand-written template that omits externalId and uses non-string cell values', async () => {
    await tableHooks.importTableIntoExisting({
      template: wrapAsDialogDoes(handWrittenTemplate),
      existingTableId: 'existing-1',
    });

    expect(tablesApi.clear).toHaveBeenCalledWith('existing-1');
    expect(recordsApi.create).toHaveBeenCalledWith({
      tableId: 'existing-1',
      records: [[{ fieldId: 'new-field-1', value: 42 }]],
    });
  });

  it('imports a git-sync table state that carries no data rows', async () => {
    await tableHooks.importTableIntoExisting({
      template: wrapAsDialogDoes(gitSyncTableState),
      existingTableId: 'existing-1',
    });

    expect(tablesApi.clear).toHaveBeenCalledWith('existing-1');
    expect(recordsApi.create).not.toHaveBeenCalled();
  });
});

describe('tableHooks.importTablesFromTemplates', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    tablesApi.create.mockResolvedValue({ id: 'new-1' });
    recordsApi.create.mockResolvedValue([]);
    fieldsApi.list.mockResolvedValue([{ id: 'field-1', externalId: 'email' }]);
  });

  it('creates no table when the file is not a table template', async () => {
    await expect(
      tableHooks.importTablesFromTemplates({
        templates: [wrapAsDialogDoes(flowTemplateFile)],
        projectId: 'project-1',
      }),
    ).rejects.toThrow('Template tables are not in a valid format');

    expect(tablesApi.create).not.toHaveBeenCalled();
  });

  it('creates no table when an earlier template in the batch is valid but a later one is not', async () => {
    await expect(
      tableHooks.importTablesFromTemplates({
        templates: [
          wrapAsDialogDoes(exportedTableTemplate),
          wrapAsDialogDoes(flowTemplateFile),
        ],
        projectId: 'project-1',
      }),
    ).rejects.toThrow('Template tables are not in a valid format');

    expect(tablesApi.create).not.toHaveBeenCalled();
  });

  it('creates the table for an exported table template', async () => {
    const tables = await tableHooks.importTablesFromTemplates({
      templates: [wrapAsDialogDoes(exportedTableTemplate)],
      projectId: 'project-1',
    });

    expect(tables).toEqual([{ id: 'new-1' }]);
    expect(tablesApi.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Customers', externalId: 'customers' }),
    );
  });
});
