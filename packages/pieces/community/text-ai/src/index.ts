import { createPiece, PieceAuth } from '@ensemble/pieces-framework';
import { askAI } from './lib/actions/ask-ai';
import { PieceCategory } from '@ensemble/shared';
import { summarizeText } from './lib/actions/summarize-text';

export const activepiecesAi = createPiece({
  displayName: 'Text AI',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.63.0',
  categories: [
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
    PieceCategory.UNIVERSAL_AI,
  ],
  logoUrl: 'https://cdn.ensemble.com/pieces/text-ai.svg',
  authors: ['anasbarg', 'amrdb'],
  actions: [askAI, summarizeText],
  triggers: [],
});
