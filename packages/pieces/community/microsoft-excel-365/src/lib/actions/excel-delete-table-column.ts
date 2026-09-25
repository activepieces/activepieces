import { createAction, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getTablePath, requireValue } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelDeleteTableColumn = createAction({
  auth: excelAuth,
  name: 'excel_delete_table_column',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Table Column',
  description: 'Delete a column and its data from a table.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently delete one table column and all its cell values, by header name or ID (resolve via excel_list_table_columns). Use excel_clear_table_filter if you only meant to remove a filter. Not safe to retry: the column is gone after the first call.',
    idempotent: false,
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
    const { table } = context.propsValue;
    const column = requireValue({ value: context.propsValue.column, name: 'Column' });
    await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${getTablePath(context.propsValue)}/columns/${encodeURIComponent(column)}`)
      .delete();
    return { success: true, table, column };
  },
});
