import {
  createPiece,
  OAuth2PropertyValue,
  PieceAuth,
} from '@activepieces/pieces-framework';
import { appendRowAction } from './lib/actions/append-row';
import { getWorksheetsAction } from './lib/actions/get-worksheets';
import { getWorksheetRowsAction } from './lib/actions/get-worksheet-rows';
import { updateRowAction } from './lib/actions/update-row';
import { clearWorksheetAction } from './lib/actions/clear-worksheet';
import { deleteWorksheetAction } from './lib/actions/delete-worksheet';
import { getWorkbooksAction } from './lib/actions/get-workbooks';
import { deleteWorkbookAction } from './lib/actions/delete-workbook';
import { addWorksheetAction } from './lib/actions/add-worksheet';
import { getTableRowsAction } from './lib/actions/get-table-rows';
import { getTableColumnsAction } from './lib/actions/get-table-columns';
import { createTableAction } from './lib/actions/create-table';
import { deleteTableAction } from './lib/actions/delete-table';
import { lookupTableColumnAction } from './lib/actions/lookup-table-column';
import { appendTableRowsAction } from './lib/actions/append-table-rows';
import { convertToRangeAction } from './lib/actions/convert-to-range';
import { readNewRows } from './lib/trigger/new-row-added';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { excelCommon } from './lib/common/common';

export const excelAuth = PieceAuth.OAuth2({
  description: 'Authentication for Microsoft Excel 365',
  authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  required: true,
  scope: ['Files.ReadWrite', 'offline_access'],
});

export const microsoftExcel = createPiece({
  displayName: 'Microsoft Excel 365',
  auth: excelAuth,
  minimumSupportedRelease: '0.8.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-excel-365.png',
  authors: ['BastienMe'],
  actions: [
    appendRowAction,
    getWorksheetsAction,
    getWorksheetRowsAction,
    updateRowAction,
    clearWorksheetAction,
    deleteWorksheetAction,
    getWorkbooksAction,
    deleteWorkbookAction,
    addWorksheetAction,
    getTableRowsAction,
    getTableColumnsAction,
    createTableAction,
    deleteTableAction,
    lookupTableColumnAction,
    appendTableRowsAction,
    convertToRangeAction,
    createCustomApiCallAction({
      baseUrl: () => excelCommon.baseUrl,
      auth: excelAuth,
      authMapping: (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [readNewRows],
});
