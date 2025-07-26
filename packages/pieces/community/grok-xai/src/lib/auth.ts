import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { makeRequest } from './common';

const markdown = `
Enter your Grok API Key.
You can create one from (https://console.x.ai/team/default/api-keys)
`;

export const grokAuth = PieceAuth.CustomAuth({
  description: markdown,
  props: {
    apiKey: Property.ShortText({
      displayName: 'API Key',
      description: 'Your Grok API Key',
      required: true,
    }),
  },
  required: true,
  async validate({ auth }) {
    try {
      let response = await makeRequest({ auth, path: '/api-key' });
      if(response.body.user_id != null) {
        return { valid: true };
      }
      return { valid: false, error: response.body.error || "Failed to verify credentials" };
    } catch (e: any) {
      return {
        valid: false,
        error: e?.message || 'Invalid Grok credentials',
      };
    }
  },
});