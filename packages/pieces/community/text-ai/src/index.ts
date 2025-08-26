import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { askAI } from './lib/actions/ask-ai';
import { PieceCategory } from '@activepieces/shared';
import { summarizeText } from './lib/actions/summarize-text';

export const activepiecesAi = createPiece({
  displayName: 'Text AI',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.67.3',
  categories: [
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
    PieceCategory.UNIVERSAL_AI,
  ],
  logoUrl: 'https://cdn.activepieces.com/pieces/text-ai.svg',
  authors: ['anasbarg', 'amrdb'],
  actions: [askAI, summarizeText],
  triggers: [],
});
