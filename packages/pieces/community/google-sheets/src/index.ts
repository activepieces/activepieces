import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { clearSheetAction } from './lib/actions/clear-sheet';
import { deleteRowAction } from './lib/actions/delete-row.action';
import { findRowByNumAction } from './lib/actions/find-row-by-num';
import { findRowsAction } from './lib/actions/find-rows';
import { getRowsAction } from './lib/actions/get-rows';
import { insertRowAction } from './lib/actions/insert-row.action';
import { updateRowAction } from './lib/actions/update-row';
import { getAccessToken, googleSheetsAuth, GoogleSheetsAuthValue, googleSheetsCommon } from './lib/common/common';
import { newRowAddedTrigger } from './lib/triggers/new-row-added-webhook';
import { newOrUpdatedRowTrigger } from './lib/triggers/new-or-updated-row.trigger';
import { insertMultipleRowsAction } from './lib/actions/insert-multiple-rows.action';
import { createWorksheetAction } from './lib/actions/create-worksheet';
import { createSpreadsheetAction } from './lib/actions/create-spreadsheet';
import { findSpreadsheets } from './lib/actions/find-spreadsheets';
import { newSpreadsheetTrigger } from './lib/triggers/new-spreadsheet';
import { newWorksheetTrigger } from './lib/triggers/new-worksheet';
import { findWorksheetAction } from './lib/actions/find-worksheet';
import { copyWorksheetAction } from './lib/actions/copy-worksheet';
import { updateMultipleRowsAction } from './lib/actions/update-multiple-rows';
import { createColumnAction } from './lib/actions/create-column';
import { exportSheetAction } from './lib/actions/export-sheet';
import { getManyRowsAction } from './lib/actions/get-many-rows';

export const googleSheets = createPiece({
  minimumSupportedRelease: '0.71.4',
  logoUrl: 'https://cdn.activepieces.com/pieces/google-sheets.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: [
    'ShayPunter',
    'Ozak93',
    'Abdallah-Alwarawreh',
    'Salem-Alaa',
    'kishanprmr',
    'MoShizzle',
    'AbdulTheActivePiecer',
    'khaledmashaly',
    'abuaboud',
    'geekyme',
  ],
  actions: [
    insertRowAction,
    insertMultipleRowsAction,
    deleteRowAction,
    updateRowAction,
    findRowsAction,
    createSpreadsheetAction,
    createWorksheetAction,
    clearSheetAction,
    findRowByNumAction,
    getRowsAction,
    getManyRowsAction,
    findSpreadsheets,
    findWorksheetAction,
    copyWorksheetAction,
    updateMultipleRowsAction,
    createColumnAction,
    exportSheetAction,
    createCustomApiCallAction({
      auth: googleSheetsAuth,
      baseUrl: () => {
        return googleSheetsCommon.baseUrl;
      },
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${(await getAccessToken(auth as GoogleSheetsAuthValue))}`,
        };
      },
    }),
  ],
  displayName: 'Google Sheets',
  description: 'Create, edit, and collaborate on spreadsheets online',
  triggers: [newOrUpdatedRowTrigger,newRowAddedTrigger,newSpreadsheetTrigger,newWorksheetTrigger],
  auth: googleSheetsAuth,
});
