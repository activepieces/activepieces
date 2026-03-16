import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getQuickPrice } from './lib/actions/get-quick-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const quickswap = createPiece({
  displayName: 'QuickSwap',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/quickswap.png',
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getQuickPrice, getChainBreakdown, getTvlHistory, getProtocolStats],
  triggers: [],
});
