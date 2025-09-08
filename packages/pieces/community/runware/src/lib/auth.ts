import { PieceAuth } from '@activepieces/pieces-framework';

export const runwareAuth = PieceAuth.SecretText({
  displayName: 'Runware API Key',
  description: `Create or retrieve your API key from the Runware dashboard.`,
  required: true,
  validate: async ({ auth }) => {
    const response = await fetch('https://api.runware.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${auth}`,
      },
    });

    if (!response.ok) {
      return {
        valid: false,
        error: 'Invalid API key. Please check your Runware API key.',
      };
    }

    return {
      valid: true,
    };
  }
});