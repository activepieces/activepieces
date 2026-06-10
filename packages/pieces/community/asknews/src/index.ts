import { createPiece } from '@activepieces/pieces-framework';
import { asknewsAuth } from './lib/common/auth';
import { searchNews } from './lib/actions/search-news';
import { generateNewsKnowledgeGraph } from './lib/actions/generate-news-knowledge-graph';
import { getArticleById } from './lib/actions/get-article-by-id';
import { asknewsChatCompletion } from './lib/actions/asknews-chat-completion';
import { searchStories } from './lib/actions/search-stories';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createANewsletter } from './lib/actions/create-a-newsletter';
import { updateANewsletter } from './lib/actions/update-a-newsletter';
import { alertForQuery } from './lib/triggers/alert-for-query';

export const asknews = createPiece({
  displayName: 'AskNews',
  auth: asknewsAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/asknews.png',
  authors: ['sanket-a11y'],
  categories: [PieceCategory.COMMERCE],
  description:
    'AskNews piece allows you to search and retrieve enriched real-time and historical news articles using AskNews API.',
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
      baseUrl: () => 'https://api.asknews.com/v1',
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth.secret_text}`,
        };
      },
    }),
  ],
  triggers: [alertForQuery],
});
