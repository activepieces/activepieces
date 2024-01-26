import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { unparseCSVTextAction } from './lib/actions/convert-json-to-csv';
import { parseCSVTextAction } from './lib/actions/convert-csv-to-json';

export const csv = createPiece({
  displayName: 'CSV',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/csv.png',
  auth: PieceAuth.None(),
  actions: [parseCSVTextAction, unparseCSVTextAction],
  authors: ['kanarelo'],
  triggers: [],
});
