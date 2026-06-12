import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { tryCatch } from '@activepieces/shared';
import { GraphError } from '@microsoft/microsoft-graph-client';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';

const namingRules = `
The name for the copied worksheet. If left empty, Excel assigns a default name. The name must:
- Not be blank or exceed 31 characters.
- Not contain any of: \`/\`, \`\\\`, \`?\`, \`*\`, \`:\`, \`[\`, \`]\`.
- Be unique within the destination workbook, and not be the reserved name "History".
`;

const copyLimitationsNote =
  'Cell values, formulas, and number formats are copied. Cell styles (fonts, fills, borders), column widths, row heights, charts, conditional formatting, data validation, and tables are not copied — Microsoft Graph does not expose a native worksheet-copy operation. When copying to a different workbook, formulas that reference other worksheets may not resolve.';

export const copyWorksheetAction = createAction({
  auth: excelAuth,
  name: 'copy_worksheet',
  displayName: 'Copy Worksheet',
  description:
    'Duplicate a worksheet into a new worksheet, in the same workbook or a different one. Copies values, formulas, and number formats.',
  audience: 'both',
  aiMetadata: {
    description:
      'Duplicates an Excel worksheet (tab) into the same or a different workbook by copying its used range — cell values or formulas plus number formats; cell styles, charts, and tables are not carried over. Use to clone a template tab or copy sheet data across workbooks. Not idempotent: each run creates another worksheet, and re-running with the same explicit name fails on the name collision.',
    idempotent: false,
  },
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    folderId: commonProps.folderId,
    workbookId: commonProps.workbookDropdown({
      displayName: 'Workbook',
      required: true,
      folderRefresherKey: 'folderId',
    }),
    worksheetId: commonProps.worksheetId,
    destinationWorkbookId: commonProps.destinationWorkbookId,
    newWorksheetName: Property.ShortText({
      displayName: 'New Worksheet Name',
      description: namingRules,
      required: false,
    }),
    copyMode: Property.StaticDropdown({
      displayName: 'Copy Mode',
      description:
        'Whether to copy the formulas (recalculated in the new sheet) or just the resulting values.',
      required: true,
      defaultValue: 'formulas',
      options: {
        options: [
          { label: 'Values and formulas', value: 'formulas' },
          { label: 'Values only', value: 'values' },
        ],
      },
    }),
  },
  async run(context) {
    const { storageSource, siteId, documentId, workbookId, worksheetId, destinationWorkbookId, newWorksheetName, copyMode } =
      context.propsValue;
    const { access_token } = context.auth;
    const cloud = (context.auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;

    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);
    const targetWorkbookId = destinationWorkbookId || workbookId;

    const client = createMSGraphClient(access_token, cloud);

    const cellProps = copyMode === 'values' ? 'values' : 'formulas';
    const usedRange: UsedRange = await client
      .api(`${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}/usedRange`)
      .select(`address,rowCount,columnCount,numberFormat,${cellProps}`)
      .get();

    let newWorksheet: AddWorksheetResponse;
    try {
      newWorksheet = await client
        .api(`${drivePath}/items/${targetWorkbookId}/workbook/worksheets/add`)
        .post(newWorksheetName ? { name: newWorksheetName } : {});
    } catch (error) {
      if (error instanceof GraphError && (error.statusCode === 400 || error.statusCode === 409)) {
        throw new Error(
          `Could not create the worksheet. The name may already exist in the destination workbook or be invalid: ${error.message || 'check the naming rules.'}`,
        );
      }
      throw error;
    }

    const cellData = copyMode === 'values' ? usedRange.values : usedRange.formulas;
    const isEmpty =
      (usedRange.rowCount ?? 0) <= 1 &&
      (usedRange.columnCount ?? 0) <= 1 &&
      isBlankCell(cellData?.[0]?.[0]);

    let copiedRange: string | null = null;
    if (!isEmpty && usedRange.address) {
      copiedRange = usedRange.address.substring(usedRange.address.lastIndexOf('!') + 1);

      const patchBody =
        copyMode === 'values'
          ? { values: usedRange.values, numberFormat: usedRange.numberFormat }
          : { formulas: usedRange.formulas, numberFormat: usedRange.numberFormat };

      const { error: patchError } = await tryCatch(() =>
        client
          .api(`${drivePath}/items/${targetWorkbookId}/workbook/worksheets/${newWorksheet.id}/range(address='${copiedRange}')`)
          .patch(patchBody),
      );
      if (patchError) {
        await tryCatch(() =>
          client.api(`${drivePath}/items/${targetWorkbookId}/workbook/worksheets/${newWorksheet.id}`).delete(),
        );
        const formulasModeHint =
          copyMode === 'formulas'
            ? ' Sheets that use table (structured-reference) formulas or merged cells may not be copyable with formulas — try setting Copy Mode to "Values only".'
            : '';
        throw new Error(
          `Failed to write the copied contents, so the new worksheet was removed: ${patchError.message}${formulasModeHint}`,
        );
      }
    }

    return {
      worksheet: newWorksheet,
      copiedToSameWorkbook: targetWorkbookId === workbookId,
      copied: {
        mode: copyMode,
        range: copiedRange,
        rows: isEmpty ? 0 : usedRange.rowCount ?? 0,
        columns: isEmpty ? 0 : usedRange.columnCount ?? 0,
      },
      note: copyLimitationsNote,
    };
  },
});

function isBlankCell(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

interface UsedRange {
  address?: string;
  values?: unknown[][];
  formulas?: unknown[][];
  numberFormat?: unknown[][];
  rowCount?: number;
  columnCount?: number;
}

interface AddWorksheetResponse {
  id: string;
  name: string;
  position: number;
  visibility: string;
}
