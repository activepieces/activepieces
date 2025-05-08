import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { getQuestion } from './lib/actions/get-question';
import { getQuestionPngPreview } from './lib/actions/get-png-rendering';
import { getDashboardQuestions } from './lib/actions/get-dashboard';
import { queryMetabaseApi } from './lib/common';
import { HttpMethod, is_chromium_installed } from '@activepieces/pieces-common';
import { getGraphQuestion } from './lib/actions/get-graph-question';

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
  authors: ['AdamSelene', 'abuaboud', 'valentin-mourtialon', 'Kevinyu-alan'],
  actions: [
    getQuestion,
    getQuestionPngPreview,
    getDashboardQuestions,
    ...(is_chromium_installed() ? [getGraphQuestion] : []),
  ],
  triggers: [],
});
