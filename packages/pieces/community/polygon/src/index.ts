import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getPolPrice } from './lib/actions/get-pol-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const polygon = createPiece({
  displayName: 'Polygon',
  description:
    'Polygon is a leading Ethereum scaling solution offering a PoS sidechain and multiple Layer-2 solutions. POL (formerly MATIC) is the native token. Access real-time TVL, price data, chain analytics, and historical metrics via free public APIs.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/polygon.png',
  auth: PieceAuth.None(),
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['bossco7598'],
  actions: [
    getProtocolTvl,
    getPolPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
