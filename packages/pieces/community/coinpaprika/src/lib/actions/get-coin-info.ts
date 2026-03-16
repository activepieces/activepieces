import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { coinpaprikaAuth } from '../../index';
import { COINPAPRIKA_BASE_URL, buildAuthHeaders } from '../common';

export const getCoinInfo = createAction({
  name: 'get_coin_info',
  auth: coinpaprikaAuth,
  displayName: 'Get Coin Info',
  description:
    'Fetch detailed information about a cryptocurrency including description, team, tags, links, and market rank.',
  props: {
    coin_id: Property.ShortText({
      displayName: 'Coin ID',
      description:
        "The CoinPaprika coin ID (e.g. 'btc-bitcoin', 'eth-ethereum'). Visit coinpaprika.com to find coin IDs.",
      required: true,
    }),
  },
  async run(context) {
    const coinId = context.propsValue.coin_id.trim();
    if (!coinId) {
      throw new Error('Coin ID cannot be empty.');
    }

    const url = `${COINPAPRIKA_BASE_URL}/coins/${encodeURIComponent(coinId)}`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      headers: buildAuthHeaders(context.auth),
    });

    const data = response.body;
    if (!data || typeof data !== 'object') {
      throw new Error(`Unexpected response from CoinPaprika for coin: ${coinId}`);
    }

    return data;
  },
});
