import { createAction, Property, PieceAuth } from '@activepieces/pieces-framework';
import { lunarCrushRequest } from '../lunarcrush-api';

export const getCoinSocialData = createAction({
  name: 'get_coin_social_data',
  displayName: 'Get Coin Social Data',
  description: 'Fetch social volume, sentiment score, and interactions for a specific cryptocurrency.',
  props: {
    coin: Property.ShortText({
      displayName: 'Coin Symbol or Slug',
      description: 'The coin symbol or slug (e.g. "bitcoin" or "BTC")',
      required: true,
    }),
  },
  auth: PieceAuth.SecretText({
    displayName: 'LunarCrush API Key',
    required: true,
    description: 'Your LunarCrush API key. Get one at https://lunarcrush.com/developers',
  }),
  async run({ propsValue, auth }) {
    const coin = propsValue.coin.trim().toLowerCase();
    const data = await lunarCrushRequest(
      auth as string,
      `/coins/${encodeURIComponent(coin)}/v1`
    );
    return data;
  },
});
