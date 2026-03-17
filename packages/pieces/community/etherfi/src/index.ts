import { createPiece, PieceAuth, PieceCategory } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getEthfiPrice } from './lib/actions/get-ethfi-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const etherfi = createPiece({
  displayName: 'Ether.fi',
  description: 'Integrate with Ether.fi — the largest Ethereum liquid restaking protocol. Access TVL data, ETHFI token price, chain breakdowns, and historical metrics.',
  logoUrl: 'https://cdn.activepieces.com/pieces/etherfi.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  authors: ['bossco7598'],
  actions: [
    getProtocolTvl,
    getEthfiPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
