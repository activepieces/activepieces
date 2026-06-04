import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getTrends } from './lib/actions/get-trends';
import { getTweet } from './lib/actions/get-tweet';
import { getUserTweets } from './lib/actions/get-user-tweets';
import { getUser } from './lib/actions/get-user';
import { searchTweets } from './lib/actions/search-tweets';
import { searchUsers } from './lib/actions/search-users';
import { xquikAuth } from './lib/auth';
import { xquikCommon } from './lib/common';

export const xquik = createPiece({
  displayName: 'Xquik',
  description:
    'Search public X/Twitter posts, users, timelines, and trends for automation workflows.',
  auth: xquikAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/xquik.png',
  authors: ['kriptoburak'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE, PieceCategory.MARKETING],
  actions: [
    searchTweets,
    getTweet,
    searchUsers,
    getUser,
    getUserTweets,
    getTrends,
    createCustomApiCallAction({
      auth: xquikAuth,
      baseUrl: () => xquikCommon.config.baseUrl,
      authMapping: async (auth) => {
        return {
          Accept: 'application/json',
          'User-Agent': xquikCommon.config.userAgent,
          'x-api-key': auth.secret_text,
          'xquik-api-contract': xquikCommon.config.apiContract,
        };
      },
    }),
  ],
  triggers: [],
});
