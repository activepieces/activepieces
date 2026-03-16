import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getMngoPrice } from './lib/actions/get-mngo-price';
import { getMarkets } from './lib/actions/get-markets';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const mangoMarkets = createPiece({
  displayName: 'Mango Markets',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/mango-markets.png',
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getMngoPrice, getMarkets, getChainBreakdown, getProtocolStats],
  triggers: [],
});
