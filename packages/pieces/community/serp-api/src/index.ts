import { createPiece } from '@activepieces/pieces-framework';
import { googleNewsSearch } from './lib/actions/google-news-search';
import { googleSearch } from './lib/actions/google-search';
import { googleTrendsSearch } from './lib/actions/google-trends-search';
import { youtubeSearch } from './lib/actions/youtube-search';
import { searchGoogleWebAi } from './lib/actions/search-google-web-ai';
import { searchGoogleNewsAi } from './lib/actions/search-google-news-ai';
import { searchYoutubeAi } from './lib/actions/search-youtube-ai';
import { searchGoogleTrendsAi } from './lib/actions/search-google-trends-ai';
import { searchGoogleMaps } from './lib/actions/search-google-maps';
import { searchGoogleScholar } from './lib/actions/search-google-scholar';
import { searchGoogleImages } from './lib/actions/search-google-images';
import { searchGoogleShopping } from './lib/actions/search-google-shopping';
import { searchGoogleJobs } from './lib/actions/search-google-jobs';
import { searchGoogleLens } from './lib/actions/search-google-lens';
import { searchGoogleLocalServices } from './lib/actions/search-google-local-services';
import { searchAppleAppStore } from './lib/actions/search-apple-app-store';
import { searchGooglePlay } from './lib/actions/search-google-play';
import { searchYelp } from './lib/actions/search-yelp';
import { searchWalmart } from './lib/actions/search-walmart';
import { searchBing } from './lib/actions/search-bing';
import { searchDuckduckgo } from './lib/actions/search-duckduckgo';
import { serpApiAuth } from './lib/auth';

export const serpApi = createPiece({
  displayName: 'SerpApi',
  description: 'Search Google, YouTube, News, and Trends with powerful filtering and analysis capabilities',
  auth: serpApiAuth,
  minimumSupportedRelease: '0.86.4',
  logoUrl: 'https://cdn.activepieces.com/pieces/serp-api.png',
  authors: ['AnkitSharmaOnGithub'],
  actions: [
    googleSearch,
    googleNewsSearch,
    youtubeSearch,
    googleTrendsSearch,
    searchGoogleWebAi,
    searchGoogleNewsAi,
    searchYoutubeAi,
    searchGoogleTrendsAi,
    searchGoogleMaps,
    searchGoogleScholar,
    searchGoogleImages,
    searchGoogleShopping,
    searchGoogleJobs,
    searchGoogleLens,
    searchGoogleLocalServices,
    searchAppleAppStore,
    searchGooglePlay,
    searchYelp,
    searchWalmart,
    searchBing,
    searchDuckduckgo,
  ],
  triggers: [],
});
