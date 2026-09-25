import { createAction, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getRangeSegment, getWorksheetPath } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelDeleteRange = createAction({
  auth: excelAuth,
  name: 'excel_delete_range',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Range',
  description: 'Delete cells at a range, shifting remaining cells up or left.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Delete the cells of an A1 range (e.g. "4:4" to delete row 4) and shift the remaining cells up or left to close the gap. Use excel_clear_range to empty cells without shifting, or excel_delete_table_row for a row in a defined table. Not idempotent: a retry deletes whatever has shifted into that address.',
    idempotent: false,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    worksheet: excelAiProps.worksheet,
    address: excelAiProps.address,
    shift: Property.StaticDropdown({
      displayName: 'Shift Remaining Cells',
      description: 'Direction to move the cells that fill the gap.',
      required: true,
      defaultValue: 'Up',
      options: {
        disabled: false,
        options: [
          { label: 'Up', value: 'Up' },
          { label: 'Left', value: 'Left' },
        ],
      },
    }),
  },
  async run(context) {
    await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${getWorksheetPath(context.propsValue)}/${getRangeSegment(context.propsValue)}/delete`)
      .post({ shift: context.propsValue.shift });
    return {
      success: true,
      worksheet: context.propsValue.worksheet,
      address: context.propsValue.address,
      shift: context.propsValue.shift,
    };
  },
});
