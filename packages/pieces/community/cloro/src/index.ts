import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { getAiAnswerAction } from './lib/actions/get-ai-answer';
import { searchGoogleAction } from './lib/actions/search-google';
import { searchGoogleNewsAction } from './lib/actions/search-google-news';
import { cloroAuth } from './lib/auth';
import { CLORO_API_URL } from './lib/common/client';

export const cloro = createPiece({
  displayName: 'cloro',
  description:
    'Live Google and Google News results, and the answers of Google AI Mode, the Google AI Overview, Bing AI Mode, ChatGPT and Gemini, with their sources.',
  auth: cloroAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/cloro.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.MARKETING],
  authors: ['rbatista191'],
  actions: [
    searchGoogleAction,
    searchGoogleNewsAction,
    getAiAnswerAction,
    createCustomApiCallAction({
      baseUrl: () => CLORO_API_URL,
      auth: cloroAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [],
});
