import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getSynPrice } from './lib/actions/get-syn-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const synapse = createPiece({
  displayName: 'Synapse Protocol',
  description:
    'Cross-chain bridge and interoperability protocol supporting 20+ blockchains. Fetch TVL, token price, chain breakdown, historical data, and protocol stats.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/synapse.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: PieceAuth.None(),
  actions: [
    getProtocolTvl,
    getSynPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  authors: ['bossco7598'],
  triggers: [],
});
