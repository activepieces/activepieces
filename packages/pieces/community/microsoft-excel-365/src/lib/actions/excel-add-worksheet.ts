import { createAction, Property } from '@activepieces/pieces-framework';
import { WorkbookWorksheet } from '@microsoft/microsoft-graph-types';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getWorkbookPath } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelAddWorksheet = createAction({
  auth: excelAuth,
  name: 'excel_add_worksheet',
  classification: 'WRITE',
  displayName: 'Add Worksheet',
  description: 'Add a new worksheet to a workbook.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Add a new, empty worksheet at the end of a workbook, optionally with a given name (Excel names it "SheetN" otherwise). To write headers or data afterwards use excel_update_range or excel_append_rows; to rename or reorder an existing sheet use excel_update_worksheet. Not idempotent: each call adds a sheet, and a retry with the same name fails because names must be unique.',
    idempotent: false,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    name: Property.ShortText({
      displayName: 'Worksheet Name',
      description: 'Name for the new worksheet. Must be unique in the workbook. Leave empty for the Excel default.',
      required: false,
    }),
  },
  async run(context) {
    const name = context.propsValue.name?.trim();
    const sheet: WorkbookWorksheet = await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${getWorkbookPath(context.propsValue)}/worksheets/add`)
      .post(name ? { name } : {});
    return {
      id: sheet.id ?? null,
      name: sheet.name ?? null,
      position: sheet.position ?? null,
      visibility: sheet.visibility ?? null,
    };
  },
});
