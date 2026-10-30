import { createPiece } from '@activepieces/pieces-framework';
import { getQuestion } from './lib/actions/get-question';
import { getQuestionPngPreview } from './lib/actions/get-png-rendering';
import { getDashboardQuestions } from './lib/actions/get-dashboard';
import {
  createCustomApiCallAction,
  is_chromium_installed,
} from '@activepieces/pieces-common';
import { getGraphQuestion } from './lib/actions/get-graph-question';
import { embedQuestion } from './lib/actions/embed-question';
import { metabaseAuth } from './lib/auth';
import { metabaseAiActions } from './lib/actions/ai';

export { metabaseAuth };

export const metabase = createPiece({
  displayName: 'Metabase',
  description: 'The simplest way to ask questions and learn from data',

  auth: metabaseAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/metabase.png',
  authors: ['AdamSelene', 'abuaboud', 'valentin-mourtialon', 'Kevinyu-alan'],
  actions: [
    getQuestion,
    getQuestionPngPreview,
    getDashboardQuestions,
    embedQuestion,
    ...(is_chromium_installed() ? [getGraphQuestion] : []),
    ...metabaseAiActions,
    createCustomApiCallAction({
      auth: metabaseAuth,
      baseUrl: (auth) =>
        auth ? `${auth.props.baseUrl.replace(/\/$/, '')}/api` : '',
      authMapping: async (auth) => ({
        'X-API-KEY': auth.props.apiKey,
      }),
    }),
  ],
  triggers: [],
});
