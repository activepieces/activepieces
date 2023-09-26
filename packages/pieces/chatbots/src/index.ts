import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { askBot } from './lib/ask-bot';

export const activebots = createPiece({
  displayName: 'Chatbots (Beta)',
  description: 'Use chatbots created in your Activepieces project',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/activebots.svg',
  authors: ['abuaboud'],
  actions: [askBot],
  triggers: [],
});
