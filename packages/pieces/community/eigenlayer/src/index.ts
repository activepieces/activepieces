import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getEigenPrice } from './lib/actions/get-eigen-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const eigenlayer = createPiece({
  displayName: 'EigenLayer',
  description:
    'EigenLayer is the foundational restaking protocol on Ethereum, enabling ETH restakers to extend cryptoeconomic security to Actively Validated Services (AVS).',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/eigenlayer.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['community'],
  actions: [
    getProtocolTvl,
    getEigenPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
