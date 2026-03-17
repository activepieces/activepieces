import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getMndePrice } from './lib/actions/get-mnde-price';
import { getMsolPrice } from './lib/actions/get-msol-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';

export const marinade = createPiece({
  displayName: 'Marinade Finance',
  description:
    'Marinade Finance is the leading liquid staking protocol on Solana. Stake SOL to receive mSOL and earn staking rewards. Monitor TVL, token prices, and protocol metrics.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/marinade.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: PieceAuth.None(),
  actions: [
    getProtocolTvl,
    getMndePrice,
    getMsolPrice,
    getChainBreakdown,
    getTvlHistory,
  ],
  authors: ['bossco7598'],
  triggers: [],
});
