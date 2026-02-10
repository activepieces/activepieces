import { createPiece } from '@activepieces/pieces-framework';
import { blogIdeas } from './lib/actions/blog-ideas';
import { blogIntros } from './lib/actions/blog-intros';
import { blogOutlines } from './lib/actions/blog-outlines';
import { contentRephraser } from './lib/actions/content-rephraser';
import { contentShorten } from './lib/actions/content-shorten';
import { facebookAds } from './lib/actions/facebook-ads';
import { generateProductDescriptions } from './lib/actions/generate-product-descriptions';
import { googleAds } from './lib/actions/google-ads';
import { landingPageHeadlines } from './lib/actions/landing-page-headlines';
import { sentenceExpander } from './lib/actions/sentence-expander';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

import { PieceCategory } from '@activepieces/shared';
import { writesonicBulkAuth } from './lib/common/auth';
import { BASE_URL } from './lib/common/client';

export const writesonicBulk = createPiece({
  displayName: 'Writesonic',
  auth: writesonicBulkAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/writesonic-bulk.png',
  authors: ['sanket-a11y'],
  categories: [
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
    PieceCategory.CONTENT_AND_FILES,
  ],
  description: 'Writesonic AI-powered writing assistant',
  actions: [
    blogIdeas,
    blogIntros,
    blogOutlines,
    contentRephraser,
    contentShorten,
    facebookAds,
    generateProductDescriptions,
    googleAds,
    landingPageHeadlines,
    sentenceExpander,
    createCustomApiCallAction({
      auth: writesonicBulkAuth,
      baseUrl: () => BASE_URL,
      authMapping: async (auth) => {
        return {
          'X-API-KEY': `${auth.secret_text}`,
        };
      },
    }),
  ],
  triggers: [],
});
