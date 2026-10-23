import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { trulataRequest } from './common';

export const trulataAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'In TruLata, open the Integrations tab and make an API key. It starts with tl_live_ and is shown once. Only the account owner or an admin can make one.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await trulataRequest<{ ok: boolean }>(auth, HttpMethod.GET, '/me');
      return { valid: true };
    } catch (e) {
      return { valid: false, error: 'TruLata did not accept that API key.' };
    }
  },
});
