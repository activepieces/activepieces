import { createPiece, PieceAuth, PieceCategory } from '@activepieces/pieces-framework';
import { getProtocolTvlAction } from './lib/actions/get-protocol-tvl';
import { getSwellPriceAction } from './lib/actions/get-swell-price';
import { getChainBreakdownAction } from './lib/actions/get-chain-breakdown';
import { getTvlHistoryAction } from './lib/actions/get-tvl-history';
import { getProtocolStatsAction } from './lib/actions/get-protocol-stats';

export const swellNetwork = createPiece({
  displayName: 'Swell Network',
  description: 'Monitor Swell Network — Ethereum liquid staking and restaking protocol (swETH, rswETH, SWELL token). Access TVL, price, chain breakdown, and historical data.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://assets.coingecko.com/coins/images/29281/large/swell.png',
  authors: ['community'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [
    getProtocolTvlAction,
    getSwellPriceAction,
    getChainBreakdownAction,
    getTvlHistoryAction,
    getProtocolStatsAction,
  ],
  triggers: [],
});
