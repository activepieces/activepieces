import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getBooPrice } from './lib/actions/get-boo-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const spookyswap = createPiece({
  displayName: 'SpookySwap',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/spookyswap.png',
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getBooPrice, getChainBreakdown, getTvlHistory, getProtocolStats],
  triggers: [],
});
