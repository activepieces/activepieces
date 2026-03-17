import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getTokenPrice } from './lib/actions/get-token-price';
import { getMarketStats } from './lib/actions/get-market-stats';
import { getNetworkOverview } from './lib/actions/get-network-overview';
import { getHistoricalPrices } from './lib/actions/get-historical-prices';
import { getTokenHolders } from './lib/actions/get-token-holders';

export const renderNetwork = createPiece({
  displayName: 'Render Network',
  description:
    'Render Network is a decentralized GPU compute network on Solana connecting artists and studios with node operators. Monitor RENDER token price, market statistics, network overview, historical OHLCV data, and top token holders — all via free public APIs.',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: undefined,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/render-network.png',
  authors: ['bossco7598'],
  actions: [
    getTokenPrice,
    getMarketStats,
    getNetworkOverview,
    getHistoricalPrices,
    getTokenHolders,
  ],
  triggers: [],
});
