import { createAction } from '@activepieces/pieces-framework';
import { WorkbookWorksheetProtectionOptions } from '@microsoft/microsoft-graph-types';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getWorksheetPath } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelProtectWorksheet = createAction({
  auth: excelAuth,
  name: 'excel_protect_worksheet',
  classification: 'WRITE',
  displayName: 'Protect Worksheet',
  description: 'Protect a worksheet against edits, optionally allowing specific operations.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lock a worksheet against edits (no password), optionally allowing specific operations such as formatting, inserting rows or sorting. Undo with excel_unprotect_worksheet; protected sheets reject writes from excel_update_range and similar atomics. Fails if the sheet is already protected, so unprotect first to change the options.',
    idempotent: false,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    worksheet: excelAiProps.worksheet,
    allowFormatCells: excelAiProps.booleanDropdown({ displayName: 'Allow Format Cells', description: 'Leave unset for the Excel default (not allowed).' }),
    allowFormatColumns: excelAiProps.booleanDropdown({ displayName: 'Allow Format Columns', description: 'Leave unset for the Excel default (not allowed).' }),
    allowFormatRows: excelAiProps.booleanDropdown({ displayName: 'Allow Format Rows', description: 'Leave unset for the Excel default (not allowed).' }),
    allowInsertColumns: excelAiProps.booleanDropdown({ displayName: 'Allow Insert Columns', description: 'Leave unset for the Excel default (not allowed).' }),
    allowInsertRows: excelAiProps.booleanDropdown({ displayName: 'Allow Insert Rows', description: 'Leave unset for the Excel default (not allowed).' }),
    allowInsertHyperlinks: excelAiProps.booleanDropdown({ displayName: 'Allow Insert Hyperlinks', description: 'Leave unset for the Excel default (not allowed).' }),
    allowDeleteColumns: excelAiProps.booleanDropdown({ displayName: 'Allow Delete Columns', description: 'Leave unset for the Excel default (not allowed).' }),
    allowDeleteRows: excelAiProps.booleanDropdown({ displayName: 'Allow Delete Rows', description: 'Leave unset for the Excel default (not allowed).' }),
    allowSort: excelAiProps.booleanDropdown({ displayName: 'Allow Sort', description: 'Leave unset for the Excel default (not allowed).' }),
    allowAutoFilter: excelAiProps.booleanDropdown({ displayName: 'Allow Auto Filter', description: 'Leave unset for the Excel default (not allowed).' }),
    allowPivotTables: excelAiProps.booleanDropdown({ displayName: 'Allow Pivot Tables', description: 'Leave unset for the Excel default (not allowed).' }),
  },
  async run(context) {
    const props = context.propsValue;
    const options: WorkbookWorksheetProtectionOptions = {
      ...(props.allowFormatCells !== undefined ? { allowFormatCells: props.allowFormatCells } : {}),
      ...(props.allowFormatColumns !== undefined ? { allowFormatColumns: props.allowFormatColumns } : {}),
      ...(props.allowFormatRows !== undefined ? { allowFormatRows: props.allowFormatRows } : {}),
      ...(props.allowInsertColumns !== undefined ? { allowInsertColumns: props.allowInsertColumns } : {}),
      ...(props.allowInsertRows !== undefined ? { allowInsertRows: props.allowInsertRows } : {}),
      ...(props.allowInsertHyperlinks !== undefined ? { allowInsertHyperlinks: props.allowInsertHyperlinks } : {}),
      ...(props.allowDeleteColumns !== undefined ? { allowDeleteColumns: props.allowDeleteColumns } : {}),
      ...(props.allowDeleteRows !== undefined ? { allowDeleteRows: props.allowDeleteRows } : {}),
      ...(props.allowSort !== undefined ? { allowSort: props.allowSort } : {}),
      ...(props.allowAutoFilter !== undefined ? { allowAutoFilter: props.allowAutoFilter } : {}),
      ...(props.allowPivotTables !== undefined ? { allowPivotTables: props.allowPivotTables } : {}),
    };
    await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${getWorksheetPath(props)}/protection/protect`)
      .post(Object.keys(options).length > 0 ? { options } : {});
    return {
      success: true,
      workbookId: props.workbookId,
      worksheet: props.worksheet,
      protected: true,
    };
  },
});
