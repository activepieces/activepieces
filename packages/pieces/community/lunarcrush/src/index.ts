import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getCoinSocialData } from './lib/actions/get-coin-social-data';
import { getTrendingCoins } from './lib/actions/get-trending-coins';
import { getCoinNews } from './lib/actions/get-coin-news';
import { getInfluencers } from './lib/actions/get-influencers';
import { getCoinTimeSeries } from './lib/actions/get-coin-time-series';

const lunarCrushAuth = PieceAuth.SecretText({
  displayName: 'LunarCrush API Key',
  required: true,
  description: 'Your LunarCrush API key. Get one at https://lunarcrush.com/developers',
});

export const lunarcrush = createPiece({
  displayName: 'LunarCrush',
  description:
    'Access crypto social sentiment data, trending coins, influencer analytics, and market intelligence from LunarCrush.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/lunarcrush.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: lunarCrushAuth,
  authors: ['bossco7598'],
  actions: [
    getCoinSocialData,
    getTrendingCoins,
    getCoinNews,
    getInfluencers,
    getCoinTimeSeries,
  ],
  triggers: [],
});
