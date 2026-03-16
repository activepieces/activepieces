import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getMetPrice } from './lib/actions/get-met-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const meteora = createPiece({
  displayName: 'Meteora',
  description:
    'Meteora is a dynamic liquidity protocol on Solana featuring Dynamic AMM pools, DLMM (Dynamic Liquidity Market Maker) with concentrated liquidity bins, and yield-bearing vaults.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/meteora.png',
  auth: PieceAuth.None(),
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['bossco7598'],
  actions: [
    getProtocolTvl,
    getMetPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
