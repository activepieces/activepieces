import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getFrwPrice } from './lib/actions/get-frw-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const francium = createPiece({
  displayName: 'Francium',
  description:
    'Francium is a leveraged yield farming protocol on Solana, allowing users to earn amplified yields by borrowing additional capital. FRW is the governance token. Monitor TVL, FRW price, chain breakdown, historical TVL, and protocol stats — all via free public APIs.',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: undefined,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/francium.png',
  authors: ['bossco7598'],
  actions: [
    getProtocolTvl,
    getFrwPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
