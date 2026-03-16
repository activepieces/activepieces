import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getTokenPrice } from './lib/actions/get-token-price';
import { getTokenOverview } from './lib/actions/get-token-overview';
import { getTokenSecurity } from './lib/actions/get-token-security';
import { getOhlcvData } from './lib/actions/get-ohlcv-data';
import { getTokenTrades } from './lib/actions/get-token-trades';

export const birdeyeAuth = PieceAuth.SecretText({
  displayName: 'Birdeye API Key',
  description: 'Get your free API key from https://birdeye.so',
  required: true,
});

export const birdeye = createPiece({
  displayName: 'Birdeye',
  auth: birdeyeAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/birdeye.png',
  categories: [PieceCategory.FINANCE],
  authors: ['bossco7598'],
  actions: [
    getTokenPrice,
    getTokenOverview,
    getTokenSecurity,
    getOhlcvData,
    getTokenTrades,
  ],
  triggers: [],
});
