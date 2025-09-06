import { PieceAuth } from '@activepieces/pieces-framework';

export const codyAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Cody AI API key. You can find this in your Cody AI dashboard under API settings.',
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await fetch('https://getcody.ai/api/v1/bots', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        return { valid: true };
      } else {
        return { valid: false, error: 'Invalid API key. Please check your Cody AI API key.' };
      }
    } catch (error) {
      return { valid: false, error: 'Failed to validate API key. Please check your connection and try again.' };
    }
  },
});
