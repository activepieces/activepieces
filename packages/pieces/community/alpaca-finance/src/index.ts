import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getAlpacaPrice } from './lib/actions/get-alpaca-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const alpacaFinance = createPiece({
  displayName: 'Alpaca Finance',
  auth: undefined,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/alpaca-finance.png',
  authors: ['bossco7598'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  description:
    'Alpaca Finance is the largest leveraged yield farming protocol on BNB Chain. Fetch TVL, token price, chain breakdown, and protocol statistics using free public APIs.',
  actions: [
    getProtocolTvl,
    getAlpacaPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
