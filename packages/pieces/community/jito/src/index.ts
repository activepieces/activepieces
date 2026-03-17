import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getJtoPrice } from './lib/actions/get-jto-price';
import { getJitoSolPrice } from './lib/actions/get-jitosol-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';

export const jito = createPiece({
  displayName: 'Jito',
  description:
    'Jito is a liquid staking protocol on Solana that offers JitoSOL — a liquid staking token earning both Solana staking rewards and MEV (Maximum Extractable Value) tips. JTO is the governance token for the Jito DAO.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/jito.png',
  auth: PieceAuth.None(),
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['bossco7598'],
  actions: [
    getProtocolTvl,
    getJtoPrice,
    getJitoSolPrice,
    getChainBreakdown,
    getTvlHistory,
  ],
  triggers: [],
});
