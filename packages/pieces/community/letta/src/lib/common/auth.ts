import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { 
  Letta,
  AuthenticationError,
  PermissionDeniedError,
  APIConnectionError,
  APIConnectionTimeoutError,
  LettaError,
} from '@letta-ai/letta-client';
import type {
  ClientOptions,
  AgentListParams,
} from './types';

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
      const clientConfig: ClientOptions = {};
      if (apiKey) {
        clientConfig.apiKey = apiKey;
      }
      if (baseUrl) {
        clientConfig.baseURL = baseUrl;
      }

      const client = new Letta(clientConfig);

      if (apiKey) {
        const listParams: AgentListParams = { limit: 1 };
        await client.agents.list(listParams);
      } else {
        await client.health();
      }

      return {
        valid: true,
      };
    } catch (error: unknown) {
      if (error instanceof AuthenticationError) {
        return {
          valid: false,
          error: 'Invalid API key. Please check your credentials.',
        };
      }
      if (error instanceof PermissionDeniedError) {
        return {
          valid: false,
          error: 'Permission denied. Please check your API key permissions.',
        };
      }
      if (error instanceof APIConnectionError || error instanceof APIConnectionTimeoutError) {
        return {
          valid: false,
          error: 'Connection failed. Please check your base URL and ensure the server is running.',
        };
      }
      if (error instanceof LettaError) {
        return {
          valid: false,
          error: `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please verify your credentials.`,
        };
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        valid: false,
        error: `Authentication failed: ${errorMessage}. Please verify your credentials.`,
      };
    }
  },
});


export type LettaAuthType = {
  apiKey?: string;
  baseUrl?: string;
};

