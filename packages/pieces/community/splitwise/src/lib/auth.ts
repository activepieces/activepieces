import { PieceAuth } from '@activepieces/pieces-framework';

const markdownDescription = `
You can generate an API key from your app's details page on Splitwise.
The API key should be kept secure as it provides access to your personal account.
`;

export const splitwiseAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await fetch('https://secure.splitwise.com/api/v3.0/get_current_user', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          valid: false,
          error: `Invalid API key: ${response.status} ${response.statusText}`,
        };
      }

      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error: `Connection error: ${(error as Error).message}`,
      };
    }
  },
});
