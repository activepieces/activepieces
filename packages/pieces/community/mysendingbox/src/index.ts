import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import {
  createCustomApiCallAction,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

const markdown = `
MySendingBox API keyis available under the developer portal.
(https://app.mysendingbox.fr/account/keys)`;

export const mySendingBoxPieceAuth = PieceAuth.CustomAuth({
  description: markdown,
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    if (auth) {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.mysendingbox.fr/',
        headers: {
          Authorization: `Basic ${btoa(`${auth.apiKey}:`)}`,
        },
      });
      return {
        valid: true,
      };
    }
    return {
      valid: false,
      error: 'Invalid Api Key',
    };
  },
});

export const mysendingbox = createPiece({
  displayName: 'Mysendingbox',
  auth: mySendingBoxPieceAuth,
  minimumSupportedRelease: '0.78.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/mysendingbox.png',
  authors: ['Blightwidow'],
  actions: [
    createCustomApiCallAction({
      baseUrl: () => {
        return 'https://api.mysendingbox.fr';
      },
      auth: mySendingBoxPieceAuth,
      authMapping: async (auth) => ({
        Authorization: `Basic ${btoa(`${auth.props.apiKey}:`)}`,
      }),
    }),
  ],
  triggers: [],
});
