import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getTokenPrice } from './lib/actions/get-token-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const ankr = createPiece({
  displayName: 'Ankr Network',
  description: 'Monitor Ankr Network TVL, token prices, and protocol statistics using DeFiLlama and CoinGecko data.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/ankr.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: PieceAuth.None(),
  actions: [
    getProtocolTvl,
    getTokenPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  authors: ['bossco7598'],
  triggers: [],
});
