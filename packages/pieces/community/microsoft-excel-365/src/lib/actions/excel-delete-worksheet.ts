import { createAction } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getWorksheetPath } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelDeleteWorksheet = createAction({
  auth: excelAuth,
  name: 'excel_delete_worksheet',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Worksheet',
  description: 'Permanently delete a worksheet from a workbook.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently delete a worksheet and all its data, tables and charts. To hide a sheet instead use excel_update_worksheet with visibility Hidden; to empty it use excel_clear_range. A workbook must keep at least one visible sheet; a retry after success fails because the sheet no longer exists.',
    idempotent: false,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    worksheet: excelAiProps.worksheet,
  },
  async run(context) {
    await createMSGraphClientFromAuth({ auth: context.auth })
      .api(getWorksheetPath(context.propsValue))
      .delete();
    return {
      success: true,
      workbookId: context.propsValue.workbookId,
      worksheet: context.propsValue.worksheet,
    };
  },
});
