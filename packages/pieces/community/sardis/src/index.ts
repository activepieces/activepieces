import {
  createCustomApiCallAction,
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { sardisSendPayment } from './lib/actions/send-payment';
import { sardisCheckBalance } from './lib/actions/check-balance';
import { sardisCheckPolicy } from './lib/actions/check-policy';
import { sardisSetPolicy } from './lib/actions/set-policy';
import { sardisListTransactions } from './lib/actions/list-transactions';

export const sardisAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Your Sardis API key (starts with sk_). Get one at https://sardis.sh/dashboard',
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.sardis.sh/api/v2/wallets',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key. Get one at https://sardis.sh/dashboard',
      };
    }
  },
});

export const sardis = createPiece({
  displayName: 'Sardis',
  description:
    'Policy-controlled payments for AI agents. Send stablecoin payments with natural language spending rules across Base, Polygon, Ethereum, Arbitrum, and Optimism.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/sardis.png',
  authors: ['EfeDurmaz16'],
  categories: [PieceCategory.PAYMENT_PROCESSING],
  auth: sardisAuth,
  actions: [
    sardisSendPayment,
    sardisCheckBalance,
    sardisCheckPolicy,
    sardisSetPolicy,
    sardisListTransactions,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.sardis.sh/api/v2',
      auth: sardisAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [],
});
