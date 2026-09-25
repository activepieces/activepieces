import { createAction } from '@activepieces/pieces-framework';
import { WorkbookWorksheet } from '@microsoft/microsoft-graph-types';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getWorkbookPath } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelListWorksheets = createAction({
  auth: excelAuth,
  name: 'excel_list_worksheets',
  classification: 'SEARCH',
  displayName: 'List Worksheets',
  description: 'List all worksheets in a workbook.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List every worksheet in a workbook with its id, name, position and visibility. Use to discover sheet names before calling range or table atomics; use excel_get_worksheet when you already know the sheet. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
  },
  async run(context) {
    const response: { value?: WorkbookWorksheet[] } = await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${getWorkbookPath(context.propsValue)}/worksheets`)
      .get();
    const worksheets = (response.value ?? []).map((sheet) => ({
      id: sheet.id ?? null,
      name: sheet.name ?? null,
      position: sheet.position ?? null,
      visibility: sheet.visibility ?? null,
    }));
    return { worksheets, count: worksheets.length };
  },
});
