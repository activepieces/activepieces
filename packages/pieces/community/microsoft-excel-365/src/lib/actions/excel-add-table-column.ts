import { createAction, Property } from '@activepieces/pieces-framework';
import { WorkbookTableColumn } from '@microsoft/microsoft-graph-types';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getTablePath, parseValues } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelAddTableColumn = createAction({
  auth: excelAuth,
  name: 'excel_add_table_column',
  classification: 'WRITE',
  displayName: 'Add Table Column',
  description: 'Add a new column to a table.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Add a column to a table, appended or at a 0-based Index, with an optional header name and optional cell values. Use excel_update_table to rename the table itself. Each call adds another column, so retries duplicate.',
    idempotent: false,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    table: excelAiProps.table,
    name: Property.ShortText({
      displayName: 'Header Name',
      description: 'Header name of the new column. Excel generates one (e.g. "Column4") if empty.',
      required: false,
    }),
    index: Property.Number({
      displayName: 'Index',
      description: '0-based column position to insert at. Leave empty to append at the right.',
      required: false,
    }),
    values: Property.Json({
      displayName: 'Values',
      description: 'Optional 2-D array with one single-cell row per table row, header first, e.g. [["Status"],["Open"],["Done"]].',
      required: false,
    }),
  },
  async run(context) {
    const { index, values } = context.propsValue;
    const name = context.propsValue.name?.trim();
    const column: WorkbookTableColumn = await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${getTablePath(context.propsValue)}/columns/add`)
      .post({
        ...(name ? { name } : {}),
        ...(index !== undefined && index !== null ? { index } : {}),
        ...(values !== undefined && values !== null ? { values: parseValues({ values, name: 'Values' }) } : {}),
      });
    return {
      id: column.id ?? null,
      index: column.index ?? null,
      name: column.name ?? null,
    };
  },
});
