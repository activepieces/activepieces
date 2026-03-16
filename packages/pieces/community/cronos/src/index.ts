import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getCroPrice } from './lib/actions/get-cro-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const cronos = createPiece({
  displayName: 'Cronos',
  description: 'Cronos is the EVM-compatible Layer-1 blockchain by Crypto.com. Access real-time TVL, CRO price, chain breakdowns, and historical data via DeFiLlama and CoinGecko.',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: undefined,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/cronos.png',
  authors: ['bossco7598'],
  actions: [
    getProtocolTvl,
    getCroPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
