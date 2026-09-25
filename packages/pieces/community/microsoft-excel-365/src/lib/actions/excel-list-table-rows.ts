import { createAction, Property } from '@activepieces/pieces-framework';
import { WorkbookTableRow } from '@microsoft/microsoft-graph-types';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getFirstRowValues, getTablePath } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelListTableRows = createAction({
  auth: excelAuth,
  name: 'excel_list_table_rows',
  classification: 'SEARCH',
  displayName: 'List Table Rows',
  description: 'List the data rows of a table.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Read a table\'s data rows (header excluded) with their 0-based row index, optionally paged with Top/Skip. Use excel_find_table_rows to match rows by a column value, and excel_list_table_columns for the header names. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    table: excelAiProps.table,
    top: Property.Number({
      displayName: 'Top',
      description: 'Maximum number of rows to return.',
      required: false,
    }),
    skip: Property.Number({
      displayName: 'Skip',
      description: 'Number of rows to skip before returning results.',
      required: false,
    }),
  },
  async run(context) {
    const { top, skip } = context.propsValue;
    const request = createMSGraphClientFromAuth({ auth: context.auth }).api(`${getTablePath(context.propsValue)}/rows`);
    const paged = top !== undefined && top !== null ? request.top(top) : request;
    const response: TableRowListResponse = await (skip !== undefined && skip !== null ? paged.skip(skip) : paged).get();
    const rows = (response.value ?? []).map((row) => ({
      index: row.index ?? null,
      values: getFirstRowValues({ values: row.values }),
    }));
    return { rows, count: rows.length };
  },
});

type TableRowListResponse = {
  value?: WorkbookTableRow[];
};
