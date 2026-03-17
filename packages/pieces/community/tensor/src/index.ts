import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getTnsrPrice } from './lib/actions/get-tnsr-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const tensor = createPiece({
  displayName: 'Tensor',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/tensor.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  description:
    'Tensor is the leading NFT marketplace on Solana with advanced order types, AMM pools, and real-time data. TNSR is the governance token.',
  authors: ['bossco7598'],
  actions: [
    getProtocolTvl,
    getTnsrPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
