import { PieceAuth } from '@activepieces/pieces-framework';

export const postmarkAuth = PieceAuth.SecretText({
  displayName: 'Server API Token',
  description:
    'Your Postmark Server API Token. Find it in your Postmark server settings under API Tokens.',
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await fetch(
        'https://api.postmarkapp.com/deliverystats',
        {
          headers: {
            Accept: 'application/json',
            'X-Postmark-Server-Token': auth,
          },
        }
      );
      if (!response.ok) {
        return { valid: false, error: 'Invalid Server API Token.' };
      }
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Could not connect to Postmark API.',
      };
    }
  },
});
