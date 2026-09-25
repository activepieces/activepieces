import { createAction, Property } from '@activepieces/pieces-framework';
import { WorkbookTableRow } from '@microsoft/microsoft-graph-types';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getTablePath, parseValues } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelAddTableRows = createAction({
  auth: excelAuth,
  name: 'excel_add_table_rows',
  classification: 'WRITE',
  displayName: 'Add Table Rows',
  description: 'Add one or more rows to a table.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Append (or insert at a 0-based Index) one or more data rows into a table; each row must have one cell per table column in column order (see excel_list_table_columns). Prefer this over range writes for tabular data because the table expands automatically. Each call adds new rows, so retries duplicate.',
    idempotent: false,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    table: excelAiProps.table,
    values: Property.Json({
      displayName: 'Rows',
      description: '2-D array of rows, each with one cell per table column, e.g. [["Ada",36],["Alan",41]].',
      required: true,
    }),
    index: Property.Number({
      displayName: 'Index',
      description: '0-based data-row position to insert at. Leave empty to append at the end.',
      required: false,
    }),
  },
  async run(context) {
    const { index } = context.propsValue;
    const values = parseValues({ values: context.propsValue.values, name: 'Rows' });
    const row: WorkbookTableRow = await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${getTablePath(context.propsValue)}/rows`)
      .post({
        values,
        ...(index !== undefined && index !== null ? { index } : {}),
      });
    return {
      index: row.index ?? null,
      values: row.values ?? null,
      rowsAdded: values.length,
    };
  },
});
