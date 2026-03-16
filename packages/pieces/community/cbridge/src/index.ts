import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getCelrPrice } from './lib/actions/get-celr-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const cbridge = createPiece({
  displayName: 'Celer cBridge',
  description:
    'Monitor Celer Network cBridge — a cross-chain bridge supporting 40+ chains with fast, low-cost asset transfers. Track CELR token price, TVL across chains, historical TVL trends, and key protocol statistics using free public APIs from DeFiLlama and CoinGecko.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/cbridge.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['bossco7598'],
  actions: [
    getProtocolTvl,
    getCelrPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
