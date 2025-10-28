import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { captureScreenshot } from './lib/actions/capture-screenshot';
import { PieceCategory } from '@activepieces/shared';
import {
  createCustomApiCallAction,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

export const peekshotAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `You can obtain your API key by navigating to [API Keys](https://dashboard.peekshot.com/dashboard/api-keys) menu.`,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.peekshot.com/api/v1/projects',
        headers: {
          'x-api-key': auth as string,
          'Content-Type': 'application/json',
        },
      });
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid API Key.' };
    }
  },
});

export const peekshot = createPiece({
  displayName: 'PeekShot',
  auth: peekshotAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/peekshot.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['balwant1707'],
  actions: [
    captureScreenshot,
    createCustomApiCallAction({
      auth: peekshotAuth,
      baseUrl: () => 'https://api.peekshot.com/api/v1',
      authMapping: async (auth) => {
        return {
          'x-api-key': auth as string,
        };
      },
    }),
  ],
  triggers: [],
});
