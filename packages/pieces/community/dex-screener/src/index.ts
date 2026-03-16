import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { searchPairsAction } from './lib/actions/search-pairs';
import { getPairsByTokenAction } from './lib/actions/get-pairs-by-token';
import { getTokenProfilesAction } from './lib/actions/get-token-profiles';
import { getLatestBoostedTokensAction } from './lib/actions/get-latest-boosted-tokens';
import { getTopBoostedTokensAction } from './lib/actions/get-top-boosted-tokens';

export const dexScreener = createPiece({
  displayName: 'DEX Screener',
  description:
    'Real-time DEX trading data across all chains. Track token prices, liquidity, trading pairs, and trending tokens powered by DexScreener.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/dex-screener.png',
  categories: [PieceCategory.FINANCE_AND_ACCOUNTING],
  authors: ['bossco7598'],
  actions: [
    searchPairsAction,
    getPairsByTokenAction,
    getTokenProfilesAction,
    getLatestBoostedTokensAction,
    getTopBoostedTokensAction,
  ],
  triggers: [],
});
