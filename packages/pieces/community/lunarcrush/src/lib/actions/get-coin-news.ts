import { createAction, Property, PieceAuth } from '@activepieces/pieces-framework';
import { lunarCrushRequest } from '../lunarcrush-api';

export const getCoinNews = createAction({
  name: 'get_coin_news',
  displayName: 'Get Coin News',
  description: 'Fetch recent news articles and social posts for a specific cryptocurrency.',
  props: {
    coin: Property.ShortText({
      displayName: 'Coin Symbol or Slug',
      description: 'The coin symbol or slug (e.g. "bitcoin" or "BTC")',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of news articles to return (default: 20, max: 100)',
      required: false,
      defaultValue: 20,
    }),
  },
  auth: PieceAuth.SecretText({
    displayName: 'LunarCrush API Key',
    required: true,
    description: 'Your LunarCrush API key. Get one at https://lunarcrush.com/developers',
  }),
  async run({ propsValue, auth }) {
    const coin = propsValue.coin.trim().toLowerCase();
    const limit = Math.min(Math.max(1, propsValue.limit ?? 20), 100);
    const data = await lunarCrushRequest(
      auth as string,
      `/coins/${encodeURIComponent(coin)}/news/v1`,
      { limit }
    );
    return data;
  },
});
