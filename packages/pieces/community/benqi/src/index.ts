import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getQiPrice } from './lib/actions/get-qi-price';
import { getSavaxPrice } from './lib/actions/get-savax-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';

export const benqi = createPiece({
  displayName: 'Benqi',
  description:
    'Benqi is a leading liquidity market protocol and liquid staking platform on Avalanche. Lend, borrow, and earn interest on crypto assets, or stake AVAX for sAVAX. QI is the governance token.',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/benqi.png',
  authors: ['bossco7598'],
  actions: [
    getProtocolTvl,
    getQiPrice,
    getSavaxPrice,
    getChainBreakdown,
    getTvlHistory,
  ],
  triggers: [],
});
