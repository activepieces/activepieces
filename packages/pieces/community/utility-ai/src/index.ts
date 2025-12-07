import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { extractStructuredData } from './lib/actions/extract-structured-data';
import { classifyText } from './lib/actions/classify-text';

export const aiUtility = createPiece({
  displayName: 'Utility AI',
  auth: PieceAuth.None(),
  categories: [
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
    PieceCategory.UNIVERSAL_AI,
  ],
  minimumSupportedRelease: '0.73.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/ai-utility.svg',
  authors: ['kishanprmr', 'amrdb'],
  actions: [classifyText, extractStructuredData],
  triggers: [],
});
