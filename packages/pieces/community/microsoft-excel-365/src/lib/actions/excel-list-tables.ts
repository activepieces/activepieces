import { createAction, Property } from '@activepieces/pieces-framework';
import { WorkbookTable } from '@microsoft/microsoft-graph-types';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getWorkbookPath, getWorksheetPath } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelListTables = createAction({
  auth: excelAuth,
  name: 'excel_list_tables',
  classification: 'SEARCH',
  displayName: 'List Tables',
  description: 'List the tables in a workbook, optionally limited to one worksheet.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Enumerate the tables in a workbook (or on one worksheet when Worksheet is set) to resolve a table name or ID for the other excel_*_table_* atomics. Use excel_list_table_columns or excel_list_table_rows to read inside a table. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    worksheet: Property.ShortText({
      displayName: 'Worksheet',
      description: 'Optional worksheet name or ID. Leave empty to list every table in the workbook.',
      required: false,
    }),
  },
  async run(context) {
    const worksheet = context.propsValue.worksheet?.trim();
    const basePath = worksheet
      ? getWorksheetPath({ ...context.propsValue, worksheet })
      : getWorkbookPath(context.propsValue);
    const response: TableListResponse = await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${basePath}/tables`)
      .get();
    const tables = (response.value ?? []).map((table) => ({
      id: table.id ?? null,
      name: table.name ?? null,
      style: table.style ?? null,
      showHeaders: table.showHeaders ?? null,
      showTotals: table.showTotals ?? null,
    }));
    return { tables, count: tables.length };
  },
});

type TableListResponse = {
  value?: WorkbookTable[];
};
