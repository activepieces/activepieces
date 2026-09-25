import { createAction } from '@activepieces/pieces-framework';
import { WorkbookWorksheet } from '@microsoft/microsoft-graph-types';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getWorksheetPath } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelGetWorksheet = createAction({
  auth: excelAuth,
  name: 'excel_get_worksheet',
  classification: 'READ',
  displayName: 'Get Worksheet',
  description: 'Get one worksheet of a workbook by name or ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Read one worksheet\'s metadata (id, name, position, visibility) by its name or ID. Use to confirm a sheet exists or read its position; use excel_list_worksheets to enumerate all sheets. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    worksheet: excelAiProps.worksheet,
  },
  async run(context) {
    const sheet: WorkbookWorksheet = await createMSGraphClientFromAuth({ auth: context.auth })
      .api(getWorksheetPath(context.propsValue))
      .get();
    return {
      id: sheet.id ?? null,
      name: sheet.name ?? null,
      position: sheet.position ?? null,
      visibility: sheet.visibility ?? null,
    };
  },
});
