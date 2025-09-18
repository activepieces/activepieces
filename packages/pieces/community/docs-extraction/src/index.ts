import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { extractWordAction } from './lib/actions/extractWord';
import { PieceCategory } from '@activepieces/shared';
export const docsExtraction = createPiece({
  displayName: 'Document Extraction',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/text-helper.svg',
  authors: ['tumrabert'],
  actions: [extractWordAction],
  categories: [PieceCategory.PRODUCTIVITY],
  triggers: [],
});
