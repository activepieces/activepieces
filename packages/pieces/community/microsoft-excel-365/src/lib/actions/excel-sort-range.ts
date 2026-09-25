import { createAction, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getRangeSegment, getWorksheetPath, parseSortFields } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelSortRange = createAction({
  auth: excelAuth,
  name: 'excel_sort_range',
  classification: 'WRITE',
  displayName: 'Sort Range',
  description: 'Sort the rows (or columns) of a cell range.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sort a plain cell range in place by one or more keys, where each key is a 0-based column offset within the range (0 = first column of the range, not column A). Use excel_sort_table for a defined table. Set hasHeaders when the first row holds headers so it stays on top; re-sorting with the same fields is safe to retry.',
    idempotent: true,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    worksheet: excelAiProps.worksheet,
    address: excelAiProps.address,
    fields: Property.Json({
      displayName: 'Sort Fields',
      description: 'Array of sort keys in priority order, e.g. [{"key":0,"ascending":true},{"key":2,"ascending":false}]. key is the 0-based offset within the range; ascending defaults to true.',
      required: true,
    }),
    hasHeaders: Property.Checkbox({
      displayName: 'Has Headers',
      description: 'Keep the first row out of the sort.',
      required: false,
      defaultValue: false,
    }),
    matchCase: Property.Checkbox({
      displayName: 'Match Case',
      description: 'Make string ordering case-sensitive.',
      required: false,
      defaultValue: false,
    }),
    orientation: Property.StaticDropdown({
      displayName: 'Orientation',
      description: 'Sort rows (default) or columns.',
      required: false,
      defaultValue: 'Rows',
      options: {
        disabled: false,
        options: [
          { label: 'Rows', value: 'Rows' },
          { label: 'Columns', value: 'Columns' },
        ],
      },
    }),
  },
  async run(context) {
    const { hasHeaders, matchCase, orientation } = context.propsValue;
    const fields = parseSortFields({ fields: context.propsValue.fields });
    await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${getWorksheetPath(context.propsValue)}/${getRangeSegment(context.propsValue)}/sort/apply`)
      .post({
        fields,
        ...(hasHeaders !== undefined ? { hasHeaders } : {}),
        ...(matchCase !== undefined ? { matchCase } : {}),
        ...(orientation ? { orientation } : {}),
      });
    return {
      success: true,
      worksheet: context.propsValue.worksheet,
      address: context.propsValue.address,
    };
  },
});
