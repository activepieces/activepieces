import { AppConnectionValueForAuthProperty, PieceAuth } from '@activepieces/pieces-framework';
import { BikaApiError, bikaClient } from './common/client';

export const BikaAuth = PieceAuth.CustomAuth({
  required: true,
  description: `Connect Bika.ai with a personal API token.

1. Sign in to [Bika.ai](https://bika.ai).
2. Click your avatar at the bottom left and open **My Settings**.
3. Open **Developer** and click **Generate new token**.
4. Copy the token and paste it below.

The token can reach every space your Bika user belongs to. On the Free plan each space allows 100 API requests a month.`,
  props: {
    token: PieceAuth.SecretText({
      displayName: 'Token',
      description: 'The API token from Bika (My Settings > Developer).',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await bikaClient.listSpaces({ token: auth.token });
      return { valid: true };
    } catch (error) {
      if (error instanceof BikaApiError && (error.status === 401 || error.status === 403)) {
        return { valid: false, error: 'Invalid token. Generate a new token in Bika (My Settings > Developer) and paste it here.' };
      }
      return { valid: false, error: `Could not check the token with Bika: ${error instanceof Error ? error.message : String(error)}` };
    }
  },
});

export type BikaConnection = AppConnectionValueForAuthProperty<typeof BikaAuth>;
