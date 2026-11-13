import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { lettaApi } from './client';

const markdown = `
To authenticate with Letta:

1. **For Letta Cloud**: Get your API key from [Letta Cloud](https://cloud.letta.ai)
2. **For Self-hosted**: Leave API key empty and provide your server URL (e.g., http://localhost:8283)
`;

export const lettaAuth = PieceAuth.CustomAuth({
  description: markdown,
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your Letta API key (required for Letta Cloud, leave empty for self-hosted)',
      required: false,
    }),
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description: 'Server URL for self-hosted instances (e.g., http://localhost:8283). Leave empty to use Letta Cloud.',
      required: false,
    }),
  },
  validate: async ({ auth }) => {
    const { apiKey, baseUrl } = auth;

    if (!apiKey && !baseUrl) {
      return {
        valid: false,
        error: 'Please provide either an API key (for Letta Cloud) or a base URL (for self-hosted).',
      };
    }

    try {
      const client = await lettaApi.getLettaClient({ auth: { apiKey, baseUrl } });
      if (apiKey) {
        await client.agents.list({ limit: 1 });
      } else {
        await client.health();
      }
      return { valid: true };
    } catch (error: unknown) {
      const status = error instanceof Error ? Reflect.get(error, 'status') : undefined;
      if (status === 401) {
        return { valid: false, error: 'Invalid API key. Please check your credentials.' };
      }
      if (status === 403) {
        return { valid: false, error: 'Permission denied. Please check your API key permissions.' };
      }
      if (error instanceof Error && (error.constructor.name === 'APIConnectionError' || error.constructor.name === 'APIConnectionTimeoutError')) {
        return { valid: false, error: 'Connection failed. Please check your base URL and ensure the server is running.' };
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { valid: false, error: `Authentication failed: ${errorMessage}. Please verify your credentials.` };
    }
  },
});


export type LettaAuthType = {
  apiKey?: string;
  baseUrl?: string;
};

