import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { minimaxAuth } from './lib/auth';
import { askMinimax } from './lib/actions/ask-minimax';

export const minimax = createPiece({
  displayName: 'MiniMax',
  description:
    'MiniMax offers large language models with 204K context windows. Models include MiniMax-M2.5 for peak performance and MiniMax-M2.5-highspeed for faster inference.',
  auth: minimaxAuth,
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/minimax.png',
  authors: ['octo-patch'],
  actions: [askMinimax],
  triggers: [],
});
