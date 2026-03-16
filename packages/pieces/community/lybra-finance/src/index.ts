import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getLbrPrice } from './lib/actions/get-lbr-price';
import { getEusdPrice } from './lib/actions/get-eusd-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';

export const lybraFinance = createPiece({
  displayName: 'Lybra Finance',
  description:
    'Lybra Finance is a leading LSDfi protocol enabling users to stake stETH/eETH as collateral to mint eUSD, a yield-bearing stablecoin. Track protocol TVL, token prices, chain breakdowns, and historical data.',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: undefined,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/lybra-finance.png',
  authors: ['bossco7598'],
  actions: [
    getProtocolTvl,
    getLbrPrice,
    getEusdPrice,
    getChainBreakdown,
    getTvlHistory,
  ],
  triggers: [],
});
