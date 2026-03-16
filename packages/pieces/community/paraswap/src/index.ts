import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { getSwapPrice } from './lib/actions/get-swap-price';
import { getTokens } from './lib/actions/get-tokens';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getPspPrice } from './lib/actions/get-psp-price';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const paraswap = createPiece({
  displayName: 'ParaSwap',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/paraswap.png',
  authors: ['bossco7598'],
  actions: [getSwapPrice, getTokens, getProtocolTvl, getPspPrice, getProtocolStats],
  triggers: [],
});
