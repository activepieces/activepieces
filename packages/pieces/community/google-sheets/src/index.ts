import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { insertRowAction } from './lib/actions/insert-row.action';
import { readNewRows } from './lib/triggers/new-row-added';
import { deleteRowAction } from './lib/actions/delete-row.action';
import { updateRowAction } from './lib/actions/update-row';
import { findRowsAction } from './lib/actions/find-rows';
import { clearSheetAction } from './lib/actions/clear-sheet';
import { findRowByNumAction } from './lib/actions/find-row-by-num';
import { getRowsAction } from './lib/actions/get-rows';

export const googleSheetsAuth = PieceAuth.OAuth2({
  description: '',

  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  scope: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.readonly',
  ],
});

export const googleSheets = createPiece({
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/google-sheets.png',
  authors: [
    'abuaboud',
    'AbdulTheActivepiecer',
    'Shay Punter',
    'Abdallah-Alwarawreh',
    'Salem-Alaa',
  ],
  actions: [
    insertRowAction,
    deleteRowAction,
    updateRowAction,
    findRowsAction,
    clearSheetAction,
    findRowByNumAction,
    getRowsAction,
  ],
  displayName: 'Google Sheets',
  triggers: [readNewRows],
  auth: googleSheetsAuth,
});
