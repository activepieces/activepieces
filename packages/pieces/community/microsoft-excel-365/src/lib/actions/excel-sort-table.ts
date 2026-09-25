import { createAction, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getTablePath, parseSortFields } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelSortTable = createAction({
  auth: excelAuth,
  name: 'excel_sort_table',
  classification: 'WRITE',
  displayName: 'Sort Table',
  description: 'Sort the rows of a table by one or more columns.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reorder a table\'s data rows in place by one or more columns (key = 0-based column index from excel_list_table_columns); the header row stays put. Use excel_sort_range for cells that are not in a table. Re-applying the same sort converges, so safe to retry.',
    idempotent: true,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    table: excelAiProps.table,
    fields: Property.Json({
      displayName: 'Sort Fields',
      description: 'Array of sort keys in priority order, e.g. [{"key":0,"ascending":true},{"key":2,"ascending":false}]. "key" is the 0-based column index within the table.',
      required: true,
    }),
    match_case: Property.Checkbox({
      displayName: 'Match Case',
      description: 'Whether letter case affects the order of text values.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { table, match_case } = context.propsValue;
    const fields = parseSortFields({ fields: context.propsValue.fields });
    await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${getTablePath(context.propsValue)}/sort/apply`)
      .post({ fields, matchCase: match_case === true });
    return { success: true, table, fieldCount: fields.length };
  },
});
