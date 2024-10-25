import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { extractStructuredData } from './lib/actions/extract-structured-data';

export const aiUtility = createPiece({
  displayName: 'AI Utility',
  auth: PieceAuth.None(),
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/ai-utility.png',
  authors: ['kishanprmr'],
  actions: [extractStructuredData],
  triggers: [],
});
