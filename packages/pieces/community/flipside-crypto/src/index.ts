import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { runQuery } from './lib/actions/run-query';
import { getQueryResults } from './lib/actions/get-query-results';
import { getQueryStatus } from './lib/actions/get-query-status';
import { cancelQuery } from './lib/actions/cancel-query';
import { getTopTokensByVolume } from './lib/actions/get-top-tokens-by-volume';

export const flipsideCryptoAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Flipside Crypto API key. Get it from [app.flipsidecrypto.xyz](https://app.flipsidecrypto.xyz) → Settings → API Keys.',
  required: true,
});

export const flipsideCrypto = createPiece({
  displayName: 'Flipside Crypto',
  description: 'On-chain SQL analytics — query blockchain data across Ethereum, Solana, and more using Flipside\'s Compass API.',
  auth: flipsideCryptoAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/flipside-crypto.png',
  authors: ['bossco7598'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [
    runQuery,
    getQueryResults,
    getQueryStatus,
    cancelQuery,
    getTopTokensByVolume,
  ],
  triggers: [],
});
