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
import { readNewRows } from './lib/triggers/new-row-added';
import { newRowAddedTrigger } from './lib/triggers/new-row-added-webhook';

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
  categories: [PieceCategory.PRODUCTIVITY],
  authors: [
    'abuaboud',
    'AbdulTheActivepiecer',
    'Shay Punter',
    'Abdallah-Alwarawreh',
    'Salem-Alaa',
    'kishanprmr',
  ],
  actions: [
    insertRowAction,
    deleteRowAction,
    updateRowAction,
    findRowsAction,
    clearSheetAction,
    findRowByNumAction,
    getRowsAction,
    createCustomApiCallAction({
      auth: googleSheetsAuth,
      baseUrl: () => {
        return googleSheetsCommon.baseUrl;
      },
      authMapping: (auth) => {
        return {
          Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
        };
      },
    }),
  ],
  displayName: 'Google Sh,
description: "Create and edit spreadsheets online",
ets',
  triggers: [readNewRows, newRowAddedTrigger],
  auth: googleSheetsAuth,
});
