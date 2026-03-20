import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { sardisSendPayment } from './lib/actions/send-payment';
import { sardisCheckBalance } from './lib/actions/check-balance';
import { sardisCheckPolicy } from './lib/actions/check-policy';
import { sardisSetPolicy } from './lib/actions/set-policy';
import { sardisListTransactions } from './lib/actions/list-transactions';
import { makeSardisClient } from './lib/common';

export const sardisAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Your Sardis API key (starts with sk_). Get one at https://sardis.sh/dashboard',
  required: true,
  validate: async ({ auth }) => {
    try {
      const client = makeSardisClient(auth);
      await client.wallets.list();
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
  authors: ['EfeDurmaz16', 'onyedikachi-david'],
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
