import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
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
import { googleSheetsCommon } from './lib/common/common';
import { newRowAddedTrigger } from './lib/triggers/new-row-added-webhook';
import { newOrUpdatedRowTrigger } from './lib/triggers/new-or-updated-row.trigger';
import { insertMultipleRowsAction } from './lib/actions/insert-multiple-rows.action';
import { createWorksheetAction } from './lib/actions/create-worksheet';
import { createSpreadsheetAction } from './lib/actions/create-spreadsheet';

export const googleSheetsAuth = PieceAuth.OAuth2({
  description: '',

  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  scope: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/drive',
  ],
});

export const googleSheets = createPiece({
  minimumSupportedRelease: '0.36.1',
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
    createCustomApiCallAction({
      auth: googleSheetsAuth,
      baseUrl: () => {
        return googleSheetsCommon.baseUrl;
      },
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
        };
      },
    }),
  ],
  displayName: 'Google Sheets',
  description: 'Create, edit, and collaborate on spreadsheets online',
  triggers: [newRowAddedTrigger, newOrUpdatedRowTrigger],
  auth: googleSheetsAuth,
});
