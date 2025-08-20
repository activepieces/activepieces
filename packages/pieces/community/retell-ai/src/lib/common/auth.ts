import { PieceAuth } from '@activepieces/pieces-framework';
import { retellAiApiCall } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

// For typing purposes in the client
export const RetellAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Retell AI API Key.',
  required: true,
});

export const retellAiAuth = PieceAuth.CustomAuth({
  description: `
  Please follow these steps to get your Retell AI API key:
  
  1. Log in to your Retell AI dashboard.
  2. Navigate to the API section.
  3. Generate a new API key or copy your existing one.
  4. Use this API key to authenticate your requests.`,
  props: {
    apiKey: RetellAiAuth,
  },
  validate: async ({ auth }) => {
    try {
      await retellAiApiCall({
        method: HttpMethod.GET,
        url: '/list-chat',
        auth: auth,
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key',
      };
    }
  },
  required: true,
});