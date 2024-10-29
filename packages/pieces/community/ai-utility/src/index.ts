import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { extractStructuredData } from './lib/actions/extract-structured-data';
import { classifyText } from './lib/actions/classify-text';
import { checkModeration } from './lib/actions/check-moderation';

export const aiUtility = createPiece({
  displayName: 'AI Utility',
  auth: PieceAuth.None(),
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/ai-utility.svg',
  authors: ['kishanprmr'],
  actions: [checkModeration, classifyText, extractStructuredData],
  triggers: [],
});
