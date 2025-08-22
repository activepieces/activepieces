import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

export const pineconeAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `
    To obtain your API key, follow these steps:
    
    1. Log in to your Pinecone account at https://pinecone.io/
    2. Go to your dashboard
    3. Navigate to "API Keys" section
    4. Copy your API key
    
    You can sign up for a free Pinecone account to test this integration.
    `,
  validate: async (auth) => {
    try {
      const headers: Record<string, string> = {
        'Api-Key': auth.auth as string,
        'Content-Type': 'application/json',
        'X-Pinecone-API-Version': '2025-01',
      };
      
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.pinecone.io/collections',
        headers,
      });
      return {
        valid: true,
      };
    } catch (e: any) {
      return {
        valid: false,
        error: e?.response?.data?.message || 'Invalid API key',
      };
    }
  },
});