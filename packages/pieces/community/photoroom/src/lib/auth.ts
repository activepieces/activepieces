import { PieceAuth } from '@activepieces/pieces-framework';
import { photoroomClient, PhotoroomApiError } from './common/client';

export const photoroomAuth = PieceAuth.CustomAuth({
  description:
    'Create an API key in the [Photoroom API dashboard](https://app.photoroom.com/api-dashboard). Prefix the key with `sandbox_` to make free, watermarked test calls.',
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await photoroomClient.fetchAccountDetails({ apiKey: auth.apiKey });
      return { valid: true };
    } catch (error) {
      if (
        error instanceof PhotoroomApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        return { valid: false, error: error.message };
      }
      const message = error instanceof Error ? error.message : String(error);
      return {
        valid: false,
        error: `Could not verify the API key against the Photoroom API: ${message}`,
      };
    }
  },
});
