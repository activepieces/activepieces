import { createAction } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getWorksheetPath } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelUnprotectWorksheet = createAction({
  auth: excelAuth,
  name: 'excel_unprotect_worksheet',
  classification: 'WRITE',
  displayName: 'Unprotect Worksheet',
  description: 'Remove protection from a worksheet.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Remove edit protection from a worksheet that was protected without a password (e.g. by excel_protect_worksheet), so range and table writes succeed again. Safe to retry: an already-unprotected sheet stays unprotected.',
    idempotent: true,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    worksheet: excelAiProps.worksheet,
  },
  async run(context) {
    await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${getWorksheetPath(context.propsValue)}/protection/unprotect`)
      .post({});
    return {
      success: true,
      workbookId: context.propsValue.workbookId,
      worksheet: context.propsValue.worksheet,
      protected: false,
    };
  },
});
