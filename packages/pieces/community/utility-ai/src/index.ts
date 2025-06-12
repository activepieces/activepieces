import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { extractStructuredData } from './lib/actions/extract-structured-data';
import { classifyText } from './lib/actions/classify-text';
import { checkModeration } from './lib/actions/check-moderation';

export const aiUtility = createPiece({
  displayName: 'Utility AI',
  auth: PieceAuth.None(),
  categories: [
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
    PieceCategory.UNIVERSAL_AI,
  ],
  minimumSupportedRelease: '0.63.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/ai-utility.svg',
  authors: ['kishanprmr', 'amrdb'],
  actions: [checkModeration, classifyText, extractStructuredData],
  triggers: [],
});
