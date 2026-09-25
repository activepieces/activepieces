import { createAction } from '@activepieces/pieces-framework';
import { WorkbookTableColumn } from '@microsoft/microsoft-graph-types';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getTablePath } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelListTableColumns = createAction({
  auth: excelAuth,
  name: 'excel_list_table_columns',
  classification: 'SEARCH',
  displayName: 'List Table Columns',
  description: 'List the columns (headers) of a table.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List a table\'s columns with their id, 0-based index and header name, to learn the column order before excel_add_table_rows or to resolve a column for excel_apply_table_filter / excel_sort_table. Use excel_get_table_column for one column\'s cell values. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    table: excelAiProps.table,
  },
  async run(context) {
    const response: TableColumnListResponse = await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${getTablePath(context.propsValue)}/columns`)
      .select('id,index,name')
      .get();
    const columns = (response.value ?? []).map((column) => ({
      id: column.id ?? null,
      index: column.index ?? null,
      name: column.name ?? null,
    }));
    return { columns, count: columns.length };
  },
});

type TableColumnListResponse = {
  value?: WorkbookTableColumn[];
};
