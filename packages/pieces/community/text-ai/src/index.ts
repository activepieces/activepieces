import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { askAi } from './lib/actions/ask-ai';

export const activepiecesAi = createPiece({
  displayName: 'Text AI',
  auth: PieceAuth.None(),
  logoUrl: 'https://cdn.activepieces.com/pieces/text-ai.png',
  authors: ['anasbarg'],
  actions: [askAi],
  triggers: [],
});
