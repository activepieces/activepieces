import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { coinpaprikaAuth } from '../../index';
import { COINPAPRIKA_BASE_URL, buildAuthHeaders } from '../common';

export const getCoinTicker = createAction({
  name: 'get_coin_ticker',
  auth: coinpaprikaAuth,
  displayName: 'Get Coin Ticker',
  description:
    'Fetch current price, market cap, volume, and other ticker data for a specific cryptocurrency.',
  props: {
    coin_id: Property.ShortText({
      displayName: 'Coin ID',
      description:
        "The CoinPaprika coin ID (e.g. 'btc-bitcoin', 'eth-ethereum'). Visit coinpaprika.com to find coin IDs.",
      required: true,
    }),
    quotes: Property.ShortText({
      displayName: 'Quote Currencies',
      description:
        "Comma-separated list of fiat or crypto quote currencies (e.g. 'USD,BTC'). Defaults to USD.",
      required: false,
      defaultValue: 'USD',
    }),
  },
  async run(context) {
    const coinId = context.propsValue.coin_id.trim();
    if (!coinId) {
      throw new Error('Coin ID cannot be empty.');
    }

    const quotes = (context.propsValue.quotes ?? 'USD').trim() || 'USD';
    const url = `${COINPAPRIKA_BASE_URL}/tickers/${encodeURIComponent(coinId)}?quotes=${encodeURIComponent(quotes)}`;

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
