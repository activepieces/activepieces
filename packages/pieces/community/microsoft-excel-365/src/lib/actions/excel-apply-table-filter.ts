import { createAction, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getTablePath, requireValue } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelApplyTableFilter = createAction({
  auth: excelAuth,
  name: 'excel_apply_table_filter',
  classification: 'WRITE',
  displayName: 'Apply Table Filter',
  description: 'Apply a filter to one column of a table.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Set the AutoFilter on one table column so only matching rows are visible in Excel, replacing any existing filter on that column. This changes what users see; to just read matching rows use excel_find_table_rows, and use excel_clear_table_filter to undo. Re-applying the same criteria is safe to retry.',
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
    criteria: Property.Json({
      displayName: 'Criteria',
      description: 'Filter criteria object. "filterOn" is required: Values, Custom, TopItems, TopPercent, BottomItems, BottomPercent, CellColor, FontColor, Dynamic or Icon. E.g. {"filterOn":"Values","values":["Open","Blocked"]} or {"filterOn":"Custom","criterion1":">=10","operator":"And","criterion2":"<=20"}.',
      required: true,
    }),
  },
  async run(context) {
    const { table, criteria } = context.propsValue;
    const column = requireValue({ value: context.propsValue.column, name: 'Column' });
    const filterOn = criteria['filterOn'];
    if (typeof filterOn !== 'string' || filterOn.trim() === '') {
      throw new Error('Criteria must include "filterOn", e.g. {"filterOn":"Values","values":["Open"]}.');
    }
    const operator = criteria['operator'];
    if (operator !== undefined && operator !== 'And' && operator !== 'Or') {
      throw new Error('Criteria "operator" must be "And" or "Or".');
    }
    await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${getTablePath(context.propsValue)}/columns/${encodeURIComponent(column)}/filter/apply`)
      .post({ criteria });
    return { success: true, table, column, filterOn };
  },
});
