import { createAction, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getTablePath, requireValue } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelClearTableFilter = createAction({
  auth: excelAuth,
  name: 'excel_clear_table_filter',
  classification: 'WRITE',
  displayName: 'Clear Table Filter',
  description: 'Remove the filter from one column of a table.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Remove the AutoFilter from one table column so all its rows are visible again, undoing excel_apply_table_filter. Data is untouched; clearing an already-clear column is a no-op, so safe to retry.',
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
    const { table } = context.propsValue;
    const column = requireValue({ value: context.propsValue.column, name: 'Column' });
    await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${getTablePath(context.propsValue)}/columns/${encodeURIComponent(column)}/filter/clear`)
      .post({});
    return { success: true, table, column };
  },
});
