import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const retellAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Retell AI API key',
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await fetch('https://api.retellai.com/v2/agents', {
        headers: {
          'Authorization': `Bearer ${auth}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        return { valid: true };
      } else {
        return { valid: false, error: 'Invalid API key' };
      }
    } catch (error) {
      return { valid: false, error: 'Failed to validate API key' };
    }
  },
});
