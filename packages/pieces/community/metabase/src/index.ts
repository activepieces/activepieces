import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { getQuestion } from './lib/actions/get-question';
import { queryMetabaseApi } from './lib/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const metabaseAuth = PieceAuth.CustomAuth({
  description: 'Metabase authentication requires a username and password.',
  required: true,
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Metabase API base URL',
      required: true,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API key',
      description:
        'Generate one on your Metabase instance (settings -> authentication -> API keys)',
      required: true,
    }),
  },

  validate: async ({ auth }) => {
    try {
      await queryMetabaseApi(
        {
          endpoint: 'login-history/current',
          method: HttpMethod.GET,
        },
        auth
      );
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key or base URL',
      };
    }
  },
});
export const metabase = createPiece({
  displayName: 'Metabase',
  description: 'The simplest way to ask questions and learn from data',

  auth: metabaseAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/metabase.png',
  authors: ['AdamSelene', 'abuaboud'],
  actions: [getQuestion],
  triggers: [],
});
