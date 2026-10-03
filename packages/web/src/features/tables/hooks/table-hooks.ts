import {
  CreateFieldRequest,
  FieldType,
  SharedTemplate,
  TableTemplate,
  Table,
  UncategorizedFolderId,
} from '@activepieces/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';

import { authenticationSession } from '@/lib/authentication-session';
import { NEW_TABLE_QUERY_PARAM } from '@/lib/route-utils';

import { fieldsApi } from '../api/fields-api';
import { recordsApi } from '../api/records-api';
import { tablesApi } from '../api/tables-api';

const queryKeys = (searchParams: URLSearchParams, projectId: string) => {
  return ['tables', searchParams.toString(), projectId];
};
export const tableMutations = {
  useRenameTable: ({ onSuccess }: { onSuccess: () => void }) => {
    return useMutation({
      mutationFn: async ({
        tableId,
        name,
      }: {
        tableId: string;
        name: string;
      }) => tablesApi.update(tableId, { name }),
      onSuccess,
    });
  },
};

export const tableHooks = {
  createTableWithDefaults: async ({
    name,
    folderId,
    projectId,
  }: {
    name: string;
    folderId?: string;
    projectId: string;
  }): Promise<Table> => {
    const table = await tablesApi.create({
      projectId,
      name,
      folderId:
        !folderId || folderId === UncategorizedFolderId ? undefined : folderId,
    });
    const field = await fieldsApi.create({
      name: 'Name',
      type: FieldType.TEXT,
      tableId: table.id,
    });
    await recordsApi.create({
      records: [[{ fieldId: field.id, value: '' }]],
      tableId: table.id,
    });
    return table;
  },
  useCreateTable: (folderId: string) => {
    const projectId = authenticationSession.getProjectId() ?? '';
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    return useMutation({
      mutationFn: async (data: { name: string }) => {
        return tableHooks.createTableWithDefaults({
          name: data.name,
          folderId,
          projectId,
        });
      },
      onSuccess: (table) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys(searchParams, projectId),
        });
        navigate(
          `/projects/${projectId}/tables/${table.id}?${NEW_TABLE_QUERY_PARAM}=true`,
        );
      },
    });
  },
  importTableIntoExisting: async ({
    template,
    existingTableId,
    maxRecords,
  }: {
    template: SharedTemplate;
    existingTableId: string;
    maxRecords?: number;
  }): Promise<Table> => {
    const tables = parseTemplateTables(template);
    if (tables.length === 0) {
      throw new Error('Template has no tables');
    }
    if (tables.length > 1) {
      throw new Error(
        'Template must contain exactly one table when importing into existing table',
      );
    }

    const tableTemplate = tables[0];
    const fieldsToCreate = parseFieldsToCreate({
      tableTemplate,
      tableId: existingTableId,
    });

    const [, existingFields] = await Promise.all([
      tablesApi.clear(existingTableId),
      fieldsApi.list({ tableId: existingTableId }),
    ]);

    await Promise.all(
      existingFields.map((field) => fieldsApi.delete(field.id)),
    );

    await tablesApi.update(existingTableId, {
      name: tableTemplate.name,
    });

    await Promise.all(fieldsToCreate.map((field) => fieldsApi.create(field)));

    if (tableTemplate.data && tableTemplate.data.rows.length > 0) {
      const createdFields = await fieldsApi.list({ tableId: existingTableId });

      const externalIdToFieldIdMap = new Map(
        createdFields.map((field) => [field.externalId, field.id]),
      );

      const recordsToImport = tableTemplate.data.rows.slice(
        0,
        maxRecords ?? 1000,
      );

      await recordsApi.create({
        tableId: existingTableId,
        records: recordsToImport.map((record) =>
          record
            .map((cell) => {
              const newFieldId = externalIdToFieldIdMap.get(cell.fieldId);
              if (!newFieldId) {
                return null;
              }
              return {
                fieldId: newFieldId,
                value: cell.value,
              };
            })
            .filter((cell) => cell !== null),
        ),
      });
    }

    return tablesApi.getById(existingTableId);
  },
  importTablesFromTemplates: async ({
    templates,
    projectId,
    maxRecords,
    folderId,
  }: {
    templates: SharedTemplate[];
    projectId: string;
    maxRecords?: number;
    folderId?: string;
  }): Promise<Table[]> => {
    if (templates.length === 0) {
      return [];
    }

    const targetFolderId =
      !folderId || folderId === UncategorizedFolderId ? undefined : folderId;

    const allTablesToImport: Array<{
      table: Table;
      tableTemplate: TableTemplate;
    }> = [];

    for (const tableTemplate of templates.flatMap(parseTemplateTables)) {
      const table = await tablesApi.create({
        projectId,
        name: tableTemplate.name,
        externalId: tableTemplate.externalId,
        fields: tableTemplate.fields,
        folderId: targetFolderId,
      });

      allTablesToImport.push({
        table,
        tableTemplate,
      });
    }

    const importPromises = allTablesToImport.map(
      async ({ table, tableTemplate }) => {
        if (tableTemplate.data && tableTemplate.data.rows.length > 0) {
          const createdFields = await fieldsApi.list({ tableId: table.id });

          const externalIdToFieldIdMap = new Map(
            createdFields.map((field) => [field.externalId, field.id]),
          );

          const recordsToImport = tableTemplate.data.rows.slice(
            0,
            maxRecords ?? 1000,
          );

          await recordsApi.create({
            tableId: table.id,
            records: recordsToImport.map((record) =>
              record
                .map((cell) => {
                  const newFieldId = externalIdToFieldIdMap.get(cell.fieldId);
                  if (!newFieldId) {
                    return null;
                  }
                  return {
                    fieldId: newFieldId,
                    value: cell.value,
                  };
                })
                .filter((cell) => cell !== null),
            ),
          });
        }

        return table;
      },
    );

    return await Promise.all(importPromises);
  },
};

function parseTemplateTables(template: SharedTemplate): TableTemplate[] {
  const tables = template.tables ?? [];
  const parsed = TableTemplate.pick({ name: true, fields: true })
    .extend({
      data: z
        .object({ rows: z.array(z.array(z.object({ fieldId: z.string() }))) })
        .nullish(),
    })
    .array()
    .safeParse(tables);
  if (!parsed.success) {
    throw new Error('Template tables are not in a valid format');
  }
  return tables;
}

function parseFieldsToCreate({
  tableTemplate,
  tableId,
}: {
  tableTemplate: TableTemplate;
  tableId: string;
}): CreateFieldRequest[] {
  const fields = CreateFieldRequest.array().safeParse(
    tableTemplate.fields.map((field, position) => ({
      ...field,
      tableId,
      position,
    })),
  );
  if (!fields.success) {
    throw new Error('Template fields are not in a valid format');
  }
  return fields.data;
}
