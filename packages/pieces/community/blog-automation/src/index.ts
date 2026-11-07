import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { baseUrl, blogAutomationAuth } from './lib/common';
import { addToCalendar, createIdea, getArticleStatus, getJob, getTokenBalance, publishArticle, writeArticle } from './lib/actions';
import { articleFailed, articlePublished, articleReady } from './lib/triggers';

export { blogAutomationAuth };

export const blogAutomation = createPiece({
  displayName: 'Blog Automation',
  description: 'Plan, write with AI and publish blog articles to WordPress.',
  auth: blogAutomationAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/blog-automation.png',
  categories: [PieceCategory.CONTENT_AND_FILES, PieceCategory.MARKETING, PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['shsoftwaresolution'],
  actions: [
    createIdea, writeArticle, getJob, publishArticle, addToCalendar, getArticleStatus, getTokenBalance,
    createCustomApiCallAction({
      baseUrl: () => baseUrl(),
      auth: blogAutomationAuth,
      authMapping: async (auth) => ({ Authorization: `Bearer ${typeof auth === 'string' ? auth : (auth as { secret_text: string }).secret_text}` }),
    }),
  ],
  triggers: [articleReady, articlePublished, articleFailed],
});
