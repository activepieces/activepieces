import {
  AuthenticationType,
  HttpMethod,
  createCustomApiCallAction,
  httpClient,
} from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { listProjects } from './lib/actions/list-projects';
import { getProjectHead } from './lib/actions/get-project-head';
import { runPrompt } from './lib/actions/run-prompt';

export const prompthubAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'PromptHub API token',
  required: true,
  validate: async (auth) => {
    try {
      await httpClient.sendRequest({
        url: 'https://app.prompthub.us/api/v1/me',
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.auth as string,
        },
        timeout: 10000,
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API key or insufficient permissions',
      };
    }
  },
});

export const prompthub = createPiece({
  displayName: 'PromptHub',
  description:
    'Integrate with PromptHub projects, retrieve heads, and run prompts.',
  auth: prompthubAuth,
  minimumSupportedRelease: '0.63.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/prompthub.png',
  authors: ['sparkybug'],
  actions: [
    listProjects,
    getProjectHead,
    runPrompt,
    createCustomApiCallAction({
      auth: prompthubAuth,
      baseUrl: () => 'https://app.prompthub.us/api/v1',
      authMapping: async (auth) => {
        return {
          authorization: `Bearer ${auth as string}`,
        };
      },
    }),
  ],
  triggers: [],
});
