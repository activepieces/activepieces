import { PieceAuth } from '@activepieces/pieces-framework';

export const buttondownAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Your Buttondown API key. Find it at https://buttondown.com/settings/programming',
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await fetch(
        'https://api.buttondown.email/v1/subscribers?page_size=1',
        {
          headers: {
            Authorization: `Token ${auth}`,
          },
        }
      );
      if (!response.ok) {
        return { valid: false, error: 'Invalid API key.' };
      }
      return { valid: true };
    } catch {
      return { valid: false, error: 'Could not connect to Buttondown API.' };
    }
  },
});
