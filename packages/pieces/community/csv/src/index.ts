import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { parseCSVTextAction } from './lib/actions/convert-csv-to-json';
import { unparseCSVTextAction } from './lib/actions/convert-json-to-csv';

export const csv = createPiece({
  displayName: 'CSV',
  description: 'CSV manipulation tools',

  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/csv.png',
  auth: PieceAuth.None(),
  categories: [PieceCategory.CORE],
  actions: [parseCSVTextAction, unparseCSVTextAction],
  authors: ["kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  triggers: [],
});
