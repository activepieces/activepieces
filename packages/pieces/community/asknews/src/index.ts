import { createPiece } from '@activepieces/pieces-framework';
import { asknewsAuth } from './lib/common/auth';
import { searchNews } from './lib/actions/search-news';
import { generateNewsKnowledgeGraph } from './lib/actions/generate-news-knowledge-graph';
import { getArticleById } from './lib/actions/get-article-by-id';
import { asknewsChatCompletion } from './lib/actions/asknews-chat-completion';
import { searchStories } from './lib/actions/search-stories';
import { PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createANewsletter } from './lib/actions/create-a-newsletter';
import { updateANewsletter } from './lib/actions/update-a-newsletter';
import { alertForQuery } from './lib/triggers/alert-for-query';

const ASKNEWS_BASE_URL = 'https://api.asknews.app/v1';

export const asknews = createPiece({
  displayName: 'AskNews',
  auth: asknewsAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/asknews.png',
  authors: ['sanket-a11y'],
  categories: [PieceCategory.COMMERCE],
  description: 'Search, summarize and track real-time and historical news.',
  actions: [
    searchNews,
    generateNewsKnowledgeGraph,
    getArticleById,
    asknewsChatCompletion,
    searchStories,
    createANewsletter,
    updateANewsletter,
    createCustomApiCallAction({
      auth: asknewsAuth,
      baseUrl: () => ASKNEWS_BASE_URL,
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth.secret_text}`,
        };
      },
      props: {
        url: {
          description: `Full URL, or a path relative to ${ASKNEWS_BASE_URL}`,
          placeholder: '/news/search?query=bitcoin',
        },
      },
    }),
  ],
  triggers: [alertForQuery],
});
