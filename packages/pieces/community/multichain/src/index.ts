import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getMultiPrice } from './lib/actions/get-multi-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const multichain = createPiece({
  displayName: 'Multichain',
  description:
    'Multichain (formerly AnySwap) is a cross-chain router protocol supporting 90+ blockchains, enabling seamless asset bridging across the multi-chain ecosystem. MULTI is the governance token.',
  logoUrl: 'https://cdn.activepieces.com/pieces/multichain.png',
  minimumSupportedRelease: '0.20.0',
  authors: ['bossco7598'],
  auth: PieceAuth.None(),
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [
    getProtocolTvl,
    getMultiPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
