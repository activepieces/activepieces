import { createAction, Property } from '@activepieces/pieces-framework';
import { WorkbookTableColumn } from '@microsoft/microsoft-graph-types';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getTablePath, requireValue } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelGetTableColumn = createAction({
  auth: excelAuth,
  name: 'excel_get_table_column',
  classification: 'READ',
  displayName: 'Get Table Column',
  description: 'Get one column of a table, including its cell values.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Read one table column by header name or ID, including all its cell values (header first). Use excel_list_table_columns to enumerate columns without their values. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    table: excelAiProps.table,
    column: Property.ShortText({
      displayName: 'Column',
      description: 'Column header name or ID. Resolve via excel_list_table_columns.',
      required: true,
    }),
  },
  async run(context) {
    const column = requireValue({ value: context.propsValue.column, name: 'Column' });
    const result: WorkbookTableColumn = await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${getTablePath(context.propsValue)}/columns/${encodeURIComponent(column)}`)
      .get();
    return {
      id: result.id ?? null,
      index: result.index ?? null,
      name: result.name ?? null,
      values: result.values ?? null,
    };
  },
});
