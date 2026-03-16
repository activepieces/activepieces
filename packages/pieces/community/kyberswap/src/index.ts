import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvlAction } from './lib/actions/get-protocol-tvl';
import { getKncPriceAction } from './lib/actions/get-knc-price';
import { getChainBreakdownAction } from './lib/actions/get-chain-breakdown';
import { getTvlHistoryAction } from './lib/actions/get-tvl-history';
import { getProtocolStatsAction } from './lib/actions/get-protocol-stats';

export const kyberswap = createPiece({
  displayName: 'KyberSwap',
  description:
    'KyberSwap is a multichain DEX aggregator and liquidity protocol that aggregates liquidity from multiple decentralized exchanges to provide the best swap rates. Access KNC token prices, protocol TVL, chain breakdowns, and historical data.',
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/kyberswap.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: undefined,
  authors: ['bossco7598'],
  actions: [
    getProtocolTvlAction,
    getKncPriceAction,
    getChainBreakdownAction,
    getTvlHistoryAction,
    getProtocolStatsAction,
  ],
  triggers: [],
});
