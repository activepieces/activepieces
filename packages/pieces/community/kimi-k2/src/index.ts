import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { chatCompletion } from './lib/actions/chat-completion';
import { baseUrl } from './lib/common/common';

export const kimiAuth = PieceAuth.SecretText({
  displayName: 'Kimi K2 API Key',
  required: true,
  validate: async (auth) => {
    try {
      await httpClient.sendRequest<{
        data: { id: string }[];
      }>({
        url: `${baseUrl}/models`,
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.auth as string,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API key',
      };
    }
  },
});

export const kimiK2 = createPiece({
  displayName: 'Kimi AI',
  description: 'Talk to Moonshot AI’s Kimi K2 model.',
  auth: kimiAuth,
  minimumSupportedRelease: '0.66.1',
  logoUrl: 'https://promptxai.com/logos/kimi-logo.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['tumrabert'],
  actions: [chatCompletion],
  triggers: [],
});
