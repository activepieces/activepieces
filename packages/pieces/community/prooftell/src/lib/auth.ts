import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { prooftellApi } from './common';

export const prooftellAuth = PieceAuth.SecretText({
  displayName: 'API key',
  description:
    'Create a key in the ProofTell dashboard (Developers → Integrations), named after this platform. A `pt_test_` key is the free sandbox: simulated, deterministic answers. A `pt_live_` key spends the account\'s balance.',
  required: true,
  getConnectionIdentifier: async ({ auth }) => (auth.startsWith('pt_test_') ? 'Sandbox' : 'Live'),
  validate: async ({ auth }) => {
    try {
      await prooftellApi.request({
        apiKey: auth,
        method: HttpMethod.GET,
        path: '/v1/balance',
      });
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'The key could not be checked.',
      };
    }
  },
});
