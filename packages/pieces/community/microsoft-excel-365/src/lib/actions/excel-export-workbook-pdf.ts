import { createAction } from '@activepieces/pieces-framework';
import { ResponseType } from '@microsoft/microsoft-graph-client';
import { DriveItem } from '@microsoft/microsoft-graph-types';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getItemPath } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelExportWorkbookPdf = createAction({
  auth: excelAuth,
  name: 'excel_export_workbook_pdf',
  classification: 'READ',
  displayName: 'Export Workbook as PDF',
  description: 'Convert a workbook to PDF and return the file.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Have Microsoft convert a workbook to PDF and return the PDF as a file; the stored workbook is not changed. Use it to share or archive a read-only snapshot; use excel_get_range or excel_get_used_range to read the cell data itself. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
  },
  async run(context) {
    const client = createMSGraphClientFromAuth({ auth: context.auth });
    const itemPath = getItemPath(context.propsValue);
    const item: DriveItem = await client.api(itemPath).get();
    const content: ArrayBuffer = await client
      .api(`${itemPath}/content`)
      .query({ format: 'pdf' })
      .responseType(ResponseType.ARRAYBUFFER)
      .get();
    const fileName = `${(item.name ?? 'workbook').replace(/\.[^.]*$/, '')}.pdf`;
    return {
      id: item.id ?? null,
      name: item.name ?? null,
      fileName,
      file: await context.files.write({ fileName, data: Buffer.from(content) }),
    };
  },
});
