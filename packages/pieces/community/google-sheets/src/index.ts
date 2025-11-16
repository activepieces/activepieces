import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  PieceAuth,
  Property,
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
import { getAccessToken, GoogleSheetsAuthValue, googleSheetsCommon } from './lib/common/common';
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
export const googleSheetsAuth =[PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  scope: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/drive',
  ],
}), PieceAuth.CustomAuth({
  displayName: 'Service Account',
  description: 'The service account to use for the Google Sheets API',
  required: true,
  props: {
    serviceAccount: Property.ShortText({
      displayName: 'Service Account JSON Key',
      description: 'The service account JSON key to use for the Google Sheets API, you can get one by going to https://console.cloud.google.com/ -> IAM & Admin -> Service Accounts -> Create Service Account -> Keys -> Add key',
      required: true,
    })}
  })];

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
  triggers: [newRowAddedTrigger, newOrUpdatedRowTrigger,newSpreadsheetTrigger,newWorksheetTrigger],
  auth: googleSheetsAuth,
});
