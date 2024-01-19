import { PieceAuth, Validators } from '@activepieces/pieces-framework';
import { getCredits } from './api';

export type ClearoutAuthType = { apiKey: string };

export const clearoutAuth = PieceAuth.CustomAuth({
  description:
    'Authenticate with your Clearout account. Get your API token from your Clearout account under Settings > API.',
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Token',
      description: 'The API token for your Clearout account',
      required: true,
      validators: [Validators.pattern(/^\S+$/)],
    }),
  },
  validate: async ({ auth }) => {
    try {
      await validateAuth(auth);
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: (e as Error)?.message,
      };
    }
  },
  required: true,
});

const validateAuth = async (auth: ClearoutAuthType) => {
  const response = await getCredits(auth);
  if (response.success !== true) {
    throw new Error(
      'Authentication failed. Please check your domain and API key and try again.'
    );
  }
};
