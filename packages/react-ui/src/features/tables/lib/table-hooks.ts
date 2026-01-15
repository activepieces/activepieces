import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { authenticationSession } from '@/lib/authentication-session';
import { NEW_TABLE_QUERY_PARAM } from '@/lib/utils';
import {
  FieldType,
  SharedTemplate,
  TableTemplate,
  Table,
} from '@activepieces/shared';

import { fieldsApi } from './fields-api';
import { recordsApi } from './records-api';
import { tablesApi } from './tables-api';

const queryKeys = (searchParams: URLSearchParams, projectId: string) => {
  return ['tables', searchParams.toString(), projectId];
};
export const tableHooks = {
  useTables: (limit?: number) => {
    const projectId = authenticationSession.getProjectId() ?? '';
    const [searchParams] = useSearchParams();
    return useQuery({
      queryKey: ['tables', searchParams.toString(), projectId],
      queryFn: () =>
        tablesApi.list({
          projectId,
          cursor: searchParams.get('cursor') ?? undefined,
          limit: limit
            ? limit
            : searchParams.get('limit')
            ? parseInt(searchParams.get('limit')!)
            : undefined,
          name: searchParams.get('name') ?? undefined,
        }),
    });
  },
  useCreateTable: () => {
    const projectId = authenticationSession.getProjectId() ?? '';
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    return useMutation({
      mutationFn: async (data: { name: string }) => {
        const table = await tablesApi.create({ projectId, name: data.name });
        const field = await fieldsApi.create({
          name: 'Name',
          type: FieldType.TEXT,
          tableId: table.id,
        });
        await recordsApi.create({
          records: [
            ...Array.from({ length: 1 }, (_) => [
              {
                fieldId: field.id,
                value: '',
              },
            ]),
          ],
          tableId: table.id,
        });
        return table;
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
    const tables = template.tables || [];
    if (tables.length === 0) {
      throw new Error('Template has no tables');
    }
    if (tables.length > 1) {
      throw new Error(
        'Template must contain exactly one table when importing into existing table',
      );
    }

    const tableTemplate = tables[0];

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

    await Promise.all(
      tableTemplate.fields.map((fieldState) =>
        fieldsApi.create({
          name: fieldState.name,
          type: fieldState.type as any,
          tableId: existingTableId,
          data: fieldState.data as any,
          externalId: fieldState.externalId,
        }),
      ),
    );

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
  }: {
    templates: SharedTemplate[];
    projectId: string;
    maxRecords?: number;
  }): Promise<Table[]> => {
    if (templates.length === 0) {
      return [];
    }

    const allTablesToImport: Array<{
      table: Table;
      tableTemplate: TableTemplate;
    }> = [];

    for (const template of templates) {
      const tables = template.tables || [];
      if (tables.length === 0) {
        continue;
      }

      for (const tableTemplate of tables) {
        const table = await tablesApi.create({
          projectId,
          name: tableTemplate.name,
          externalId: tableTemplate.externalId,
          fields: tableTemplate.fields,
        });

        allTablesToImport.push({
          table,
          tableTemplate,
        });
      }
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
