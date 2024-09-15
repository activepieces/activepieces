import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { askAi } from './lib/actions/ask-ai';
import { PieceCategory } from '@activepieces/shared';
import { extractStructuredData } from './lib/actions/extract-structured-data';

export const activepiecesAi = createPiece({
  displayName: 'Text AI',
  auth: PieceAuth.None(),
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  logoUrl: 'https://cdn.activepieces.com/pieces/text-ai.svg',
  authors: ['anasbarg'],
  actions: [askAi, extractStructuredData],
  triggers: [],
});
