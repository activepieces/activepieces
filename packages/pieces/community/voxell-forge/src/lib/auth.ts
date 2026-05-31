import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

const authDescription = `
**Get your Voxell Forge API key:**

1. Sign in at https://dash.voxell.ai
2. Open **API Keys**
3. Create a key and paste it here.
  `;

export const voxellForgeAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: authDescription,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.voxell.ai/v1/embed',
        headers: {
          Authorization: `Bearer ${auth}`,
          'Content-Type': 'application/json',
        },
        body: {
          texts: ['hello world'],
          model: 'turbo',
          dim: 128,
        },
      });
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid Voxell Forge API key' };
    }
  },
});
