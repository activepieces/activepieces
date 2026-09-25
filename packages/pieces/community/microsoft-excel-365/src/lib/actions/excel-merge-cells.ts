import { createAction, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getRangeSegment, getWorksheetPath } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelMergeCells = createAction({
  auth: excelAuth,
  name: 'excel_merge_cells',
  classification: 'WRITE',
  displayName: 'Merge Cells',
  description: 'Merge the cells of a range into one cell.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Merge the cells of an A1 range into a single cell, or with across=true merge each row of the range separately. Only the top-left value is kept; the other cells\' values are discarded. Safe to retry: merging an already-merged range leaves it merged.',
    idempotent: true,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    worksheet: excelAiProps.worksheet,
    address: excelAiProps.address,
    across: Property.Checkbox({
      displayName: 'Merge Across',
      description: 'Merge each row of the range into its own cell instead of the whole range into one.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const across = context.propsValue.across ?? false;
    await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${getWorksheetPath(context.propsValue)}/${getRangeSegment(context.propsValue)}/merge`)
      .post({ across });
    return {
      success: true,
      worksheet: context.propsValue.worksheet,
      address: context.propsValue.address,
      across,
    };
  },
});
