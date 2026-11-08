import { HttpMethod, is_chromium_installed } from '@activepieces/pieces-common';
import {
  AppConnectionType,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';

import { queryMetabaseApi } from './common';

const baseProps = {
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
};

const authProps = is_chromium_installed()
  ? {
      ...baseProps,
      embeddingKey: Property.ShortText({
        displayName: 'Embedding key',
        description:
          'Needed if you want to generate a graph of a question (settings -> embedding -> static embedding).',
        required: false,
      }),
    }
  : baseProps;

export const metabaseAuth = PieceAuth.CustomAuth({
  description: 'Metabase authentication requires a baseUrl and a password.',
  required: true,
  props: authProps,

  validate: async ({ auth }) => {
    try {
      await queryMetabaseApi(
        {
          endpoint: 'login-history/current',
          method: HttpMethod.GET,
        },
        {
          type: AppConnectionType.CUSTOM_AUTH,
          props: auth,
        }
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
