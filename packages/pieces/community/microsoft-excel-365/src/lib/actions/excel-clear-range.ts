import { createAction, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getRangeSegment, getWorksheetPath } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelClearRange = createAction({
  auth: excelAuth,
  name: 'excel_clear_range',
  classification: 'DESTRUCTIVE',
  displayName: 'Clear Range',
  description: 'Clear the contents and/or formatting of a cell range.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Clear the contents, formats, or both of an A1 range (e.g. "A2:Z1000", "C:C", "5:5") without shifting surrounding cells. Use excel_delete_range to remove the cells and shift others up or left instead. Cleared data cannot be restored, but repeating the call is harmless.',
    idempotent: true,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    worksheet: excelAiProps.worksheet,
    address: excelAiProps.address,
    applyTo: Property.StaticDropdown({
      displayName: 'Clear',
      description: 'What to clear. Defaults to All.',
      required: false,
      defaultValue: 'All',
      options: {
        disabled: false,
        options: [
          { label: 'Contents and formats', value: 'All' },
          { label: 'Contents only', value: 'Contents' },
          { label: 'Formats only', value: 'Formats' },
        ],
      },
    }),
  },
  async run(context) {
    const applyTo = context.propsValue.applyTo ?? 'All';
    await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${getWorksheetPath(context.propsValue)}/${getRangeSegment(context.propsValue)}/clear`)
      .post({ applyTo });
    return {
      success: true,
      worksheet: context.propsValue.worksheet,
      address: context.propsValue.address,
      applyTo,
    };
  },
});
