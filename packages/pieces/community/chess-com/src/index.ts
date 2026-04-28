import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getPlayerProfile } from './lib/actions/get-player-profile';
import { getPlayerStats } from './lib/actions/get-player-stats';
import { getDailyPuzzle } from './lib/actions/get-daily-puzzle';

export const chesscom = createPiece({
  displayName: 'Chess.com',
  description: 'Access Chess.com player data',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/chess-com.png',
  categories: [PieceCategory.ENTERTAINMENT],
  authors: ['FionnHughes'],
  actions: [getPlayerProfile, getPlayerStats, getDailyPuzzle],
  triggers: [],
});