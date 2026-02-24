import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { addWorksheetAction } from './lib/actions/add-worksheet';
import { appendRowAction } from './lib/actions/append-row';
import { appendTableRowsAction } from './lib/actions/append-table-rows';
import { clearWorksheetAction } from './lib/actions/clear-worksheet';
import { convertToRangeAction } from './lib/actions/convert-to-range';
import { createTableAction } from './lib/actions/create-table';
import { createWorkbook } from './lib/actions/create-workbook';
import { deleteTableAction } from './lib/actions/delete-table';
import { deleteWorkbookAction } from './lib/actions/delete-workbook';
import { deleteWorksheetAction } from './lib/actions/delete-worksheet';
import { getTableColumnsAction } from './lib/actions/get-table-columns';
import { getTableRowsAction } from './lib/actions/get-table-rows';
import { getWorkbooksAction } from './lib/actions/get-workbooks';
import { getWorksheetRowsAction } from './lib/actions/get-worksheet-rows';
import { getWorksheetsAction } from './lib/actions/get-worksheets';
import { lookupTableColumnAction } from './lib/actions/lookup-table-column';
import { updateRowAction } from './lib/actions/update-row';

import { clearRangeAction } from './lib/actions/clear-cells-by-range';
import { clearColumnAction } from './lib/actions/clear-column-by-index';
import { clearRowAction } from './lib/actions/clear-row-by-id';
import { createWorksheetAction } from './lib/actions/create-worksheet';
import { findRowAction } from './lib/actions/find-row';
import { getRangeAction } from './lib/actions/get-cells-in-range';
import { getRowAction } from './lib/actions/get-row-by-id';
import { getWorksheetAction } from './lib/actions/get-worksheet-by-id';
import { renameWorksheetAction } from './lib/actions/rename-worksheet';

import { readNewRows } from './lib/trigger/new-row-added';

import { newRowInTableTrigger } from './lib/trigger/new-row-in-table';
import { newWorksheetTrigger } from './lib/trigger/new-worksheet';
import { updatedRowTrigger } from './lib/trigger/updated-row';

import { appendMultipleRowsAction } from './lib/actions/append-multiple-rows';
import { findWorkbookAction } from './lib/actions/find-workbooks';
import { findWorksheetAction } from './lib/actions/find-worksheets';
import { getWorksheetColumnsAction } from './lib/actions/get-wroksheet-columns';
import { excelAuth } from './lib/auth';
import { excelCommon } from './lib/common/common';

export const microsoftExcel = createPiece({
  displayName: 'Microsoft Excel 365',
  description: 'Spreadsheet software by Microsoft',

  auth: excelAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-excel-365.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: [
    'BastienMe',
    'kishanprmr',
    'MoShizzle',
    'abuaboud',
    'Pranith124',
    'onyedikachi-david',
  ],
  actions: [
    appendRowAction,
    appendMultipleRowsAction,
    getWorksheetsAction,
    getWorksheetRowsAction,
    updateRowAction,
    clearWorksheetAction,
    deleteWorksheetAction,
    getWorkbooksAction,
    getWorksheetColumnsAction,
    deleteWorkbookAction,
    addWorksheetAction,
    getTableRowsAction,
    getTableColumnsAction,
    createTableAction,
    deleteTableAction,
    lookupTableColumnAction,
    appendTableRowsAction,
    convertToRangeAction,
    createWorkbook,
    clearColumnAction,
    clearRangeAction,
    clearRowAction,
    createWorksheetAction,
    findRowAction,
    findWorkbookAction,
    findWorksheetAction,
    getRangeAction,
    getRowAction,
    getWorksheetAction,
    renameWorksheetAction,
    createCustomApiCallAction({
      baseUrl: () => excelCommon.baseUrl,
      auth: excelAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [
    readNewRows,
    newRowInTableTrigger,
    newWorksheetTrigger,
    updatedRowTrigger,
  ],
});
