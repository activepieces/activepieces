import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { minimaxAuth } from './lib/auth';
import { askMinimax } from './lib/actions/ask-minimax';

export const minimax = createPiece({
  displayName: 'MiniMax',
  description:
    'MiniMax offers large language models with a 512K context window. Models include MiniMax-M3 — the flagship model with up to 128K output and image input support — and MiniMax-M2.7 / MiniMax-M2.7-highspeed.',
  auth: minimaxAuth,
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/minimax.png',
  authors: ['octo-patch'],
  actions: [askMinimax],
  triggers: [],
});
