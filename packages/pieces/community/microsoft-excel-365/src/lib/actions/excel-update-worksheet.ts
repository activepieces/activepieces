import { createAction, Property } from '@activepieces/pieces-framework';
import { WorkbookWorksheet } from '@microsoft/microsoft-graph-types';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getWorksheetPath } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelUpdateWorksheet = createAction({
  auth: excelAuth,
  name: 'excel_update_worksheet',
  classification: 'WRITE',
  displayName: 'Update Worksheet',
  description: 'Rename, move, or change the visibility of a worksheet.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Change a worksheet\'s name, position (0-based tab order) and/or visibility; only the fields you provide are changed. Use excel_add_worksheet to create a sheet and excel_delete_worksheet to remove one. At least one field is required; safe to retry with the same values.',
    idempotent: true,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    worksheet: excelAiProps.worksheet,
    name: Property.ShortText({
      displayName: 'New Name',
      description: 'New worksheet name. Must be unique in the workbook.',
      required: false,
    }),
    position: Property.Number({
      displayName: 'Position',
      description: '0-based position of the sheet among the workbook tabs.',
      required: false,
    }),
    visibility: Property.StaticDropdown({
      displayName: 'Visibility',
      description: 'Visible, Hidden (user can unhide) or VeryHidden (only unhideable via API).',
      required: false,
      options: {
        disabled: false,
        placeholder: 'Keep current visibility',
        options: [
          { label: 'Visible', value: 'Visible' },
          { label: 'Hidden', value: 'Hidden' },
          { label: 'Very Hidden', value: 'VeryHidden' },
        ],
      },
    }),
  },
  async run(context) {
    const { name, position, visibility } = context.propsValue;
    const trimmedName = name?.trim();
    const body = {
      ...(trimmedName ? { name: trimmedName } : {}),
      ...(position !== undefined && position !== null ? { position } : {}),
      ...(visibility ? { visibility } : {}),
    };
    if (Object.keys(body).length === 0) {
      throw new Error('Provide at least one of name, position or visibility to update.');
    }
    const sheet: WorkbookWorksheet = await createMSGraphClientFromAuth({ auth: context.auth })
      .api(getWorksheetPath(context.propsValue))
      .patch(body);
    return {
      id: sheet.id ?? null,
      name: sheet.name ?? null,
      position: sheet.position ?? null,
      visibility: sheet.visibility ?? null,
    };
  },
});
