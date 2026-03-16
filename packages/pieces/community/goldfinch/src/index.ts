import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getGfiPrice } from './lib/actions/get-gfi-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const goldfinch = createPiece({
  displayName: 'Goldfinch',
  description:
    'Goldfinch is a decentralized credit protocol that enables crypto loans without crypto collateral, focusing on real-world borrowers in emerging markets. Monitor TVL, GFI price, chain breakdown, historical TVL, and protocol stats — all via free public APIs.',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: undefined,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/goldfinch.png',
  authors: ['bossco7598'],
  actions: [
    getProtocolTvl,
    getGfiPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
