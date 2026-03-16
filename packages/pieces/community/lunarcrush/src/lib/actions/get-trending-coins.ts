import { createAction, Property, PieceAuth } from '@activepieces/pieces-framework';
import { lunarCrushRequest } from '../lunarcrush-api';

export const getTrendingCoins = createAction({
  name: 'get_trending_coins',
  displayName: 'Get Trending Coins',
  description: 'Fetch the top cryptocurrencies ranked by social activity and engagement.',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of coins to return (default: 10, max: 100)',
      required: false,
      defaultValue: 10,
    }),
  },
  auth: PieceAuth.SecretText({
    displayName: 'LunarCrush API Key',
    required: true,
    description: 'Your LunarCrush API key. Get one at https://lunarcrush.com/developers',
  }),
  async run({ propsValue, auth }) {
    const limit = Math.min(Math.max(1, propsValue.limit ?? 10), 100);
    const data = await lunarCrushRequest(
      auth as string,
      '/coins/list/v2',
      { limit, sort: 'social_volume_global', desc: 1 }
    );
    return data;
  },
});
