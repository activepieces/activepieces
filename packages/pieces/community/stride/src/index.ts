import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getTokenPrice } from './lib/actions/get-token-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const stride = createPiece({
  displayName: 'Stride',
  description: 'Stride is a Cosmos liquid staking protocol. Fetch TVL, token prices, chain breakdowns, TVL history, and key stats for the Stride protocol from DeFiLlama and CoinGecko.',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: undefined,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/stride.png',
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getTokenPrice, getChainBreakdown, getTvlHistory, getProtocolStats],
  triggers: [],
});
