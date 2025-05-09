import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { findTable, getTableDetails } from './lib/actions/table';
import { getTableRow } from './lib/actions/row';
import { findRow } from './lib/actions/find-row';
import { createRow } from './lib/actions/create-row';
import { upsertRow } from './lib/actions/upsert-row';
import { updateRow } from './lib/actions/update-row';
import { newRowCreated } from './lib/triggers/new-row-created';
import { rowUpdated } from './lib/triggers/row-updated';

export const codaAuth = PieceAuth.SecretText({
  displayName: 'Coda API Key',
  description: 'Your Coda API Key. Visit https://coda.io/account to get one.',
  required: true,
});

export const coda = createPiece({
  displayName: 'Coda',
  logoUrl: 'https://cdn.activepieces.com/pieces/coda.png',
  auth: codaAuth,
  authors: [],
  actions: [findTable, getTableDetails, getTableRow, findRow, createRow, upsertRow, updateRow],
  triggers: [newRowCreated, rowUpdated],
});
