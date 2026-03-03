import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { googleNewsSearch } from './lib/actions/google-news-search';
import { googleSearch } from './lib/actions/google-search';
import { googleTrendsSearch } from './lib/actions/google-trends-search';
import { youtubeSearch } from './lib/actions/youtube-search';
import { SerpApiClient } from './lib/services/serp-api-client';
import { SerpApiValidator } from './lib/utils/validators';
import { serpApiAuth } from './lib/auth';

export const serpApi = createPiece({
  displayName: 'SerpApi',
  description: 'Search Google, YouTube, News, and Trends with powerful filtering and analysis capabilities',
  auth: serpApiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/serp-api.png',
  authors: ['AnkitSharmaOnGithub'],
  actions: [
    googleSearch,
    googleNewsSearch,
    youtubeSearch,
    googleTrendsSearch,
  ],
  triggers: [],
});
