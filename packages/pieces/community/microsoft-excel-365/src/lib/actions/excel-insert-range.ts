import { createAction, Property } from '@activepieces/pieces-framework';
import { WorkbookRange } from '@microsoft/microsoft-graph-types';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getRangeSegment, getWorksheetPath } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelInsertRange = createAction({
  auth: excelAuth,
  name: 'excel_insert_range',
  classification: 'WRITE',
  displayName: 'Insert Range',
  description: 'Insert blank cells at a range, shifting existing cells down or right.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Insert blank cells at an A1 range (e.g. "5:7" for three whole rows, "B:B" for a column), shifting existing cells down or right to make room. Use excel_delete_range for the reverse, or excel_append_rows to add data below the last row without shifting. Not idempotent: each call inserts more cells.',
    idempotent: false,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    worksheet: excelAiProps.worksheet,
    address: excelAiProps.address,
    shift: Property.StaticDropdown({
      displayName: 'Shift Existing Cells',
      description: 'Direction to move the existing cells.',
      required: true,
      defaultValue: 'Down',
      options: {
        disabled: false,
        options: [
          { label: 'Down', value: 'Down' },
          { label: 'Right', value: 'Right' },
        ],
      },
    }),
  },
  async run(context) {
    const range: WorkbookRange = await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${getWorksheetPath(context.propsValue)}/${getRangeSegment(context.propsValue)}/insert`)
      .post({ shift: context.propsValue.shift });
    return {
      address: range.address ?? null,
      rowCount: range.rowCount ?? null,
      columnCount: range.columnCount ?? null,
    };
  },
});
