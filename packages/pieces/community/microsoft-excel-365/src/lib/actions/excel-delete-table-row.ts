import { createAction, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getTablePath } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelDeleteTableRow = createAction({
  auth: excelAuth,
  name: 'excel_delete_table_row',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Table Row',
  description: 'Delete one data row of a table by its index.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Delete a single data row from a table by its 0-based index (header excluded); get the index from excel_list_table_rows or excel_find_table_rows. Rows below shift up, so a retry with the same index deletes a different row: do not retry blindly.',
    idempotent: false,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    table: excelAiProps.table,
    index: Property.Number({
      displayName: 'Row Index',
      description: '0-based index of the data row to delete (the first row under the header is 0).',
      required: true,
    }),
  },
  async run(context) {
    const { index, table } = context.propsValue;
    if (!Number.isInteger(index) || index < 0) {
      throw new Error('Row Index must be a whole number of 0 or more.');
    }
    await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${getTablePath(context.propsValue)}/rows/$/itemAt(index=${index})`)
      .delete();
    return { success: true, table, index };
  },
});
