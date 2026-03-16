import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getJoePrice } from './lib/actions/get-joe-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const traderJoe = createPiece({
  displayName: 'Trader Joe',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/trader-joe.png',
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getJoePrice, getChainBreakdown, getTvlHistory, getProtocolStats],
  triggers: [],
});
