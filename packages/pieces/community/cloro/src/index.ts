import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { getAiAnswerAction } from './lib/actions/get-ai-answer';
import { searchBingAction } from './lib/actions/search-bing';
import { searchGoogleAction } from './lib/actions/search-google';
import { searchGoogleNewsAction } from './lib/actions/search-google-news';
import { cloroAuth } from './lib/auth';
import { CLORO_API_URL, cloroApi } from './lib/common/client';

export const cloro = createPiece({
  displayName: 'cloro',
  description:
    'Live Google, Google News and Bing results, and the answers of Google AI Mode, the Google AI Overview, Bing AI Mode, the Bing AI Overview, ChatGPT and Gemini, with their sources.',
  auth: cloroAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/cloro.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.MARKETING],
  authors: ['rbatista191'],
  actions: [
    searchGoogleAction,
    searchGoogleNewsAction,
    searchBingAction,
    getAiAnswerAction,
    createCustomApiCallAction({
      baseUrl: () => CLORO_API_URL,
      auth: cloroAuth,
      authMapping: async (auth, propsValue) => {
        cloroApi.assertCloroUrl(propsValue['url']?.['url']);
        return { Authorization: `Bearer ${auth.secret_text}` };
      },
    }),
  ],
  triggers: [],
});
