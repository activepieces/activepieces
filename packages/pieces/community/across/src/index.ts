import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getAcxPrice } from './lib/actions/get-acx-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const across = createPiece({
  displayName: 'Across Protocol',
  description:
    'Across Protocol is a cross-chain bridge optimized for speed and low fees, secured by UMA\'s optimistic oracle. ACX is the governance token.',
  logoUrl: 'https://cdn.activepieces.com/pieces/across.png',
  minimumSupportedRelease: '0.20.0',
  authors: ['bossco7598'],
  auth: PieceAuth.None(),
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [
    getProtocolTvl,
    getAcxPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
