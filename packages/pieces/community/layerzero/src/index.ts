import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getZroPrice } from './lib/actions/get-zro-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const layerzero = createPiece({
  displayName: 'LayerZero',
  description:
    'LayerZero is an omnichain interoperability protocol enabling cross-chain messaging and token transfers across 50+ blockchains. ZRO is the governance token. Fetch analytics via free public APIs — no API key required.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/layerzero.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['bossco7598'],
  actions: [
    getProtocolTvl,
    getZroPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
