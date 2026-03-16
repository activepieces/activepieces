import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { coinpaprikaAuth } from '../../index';
import { COINPAPRIKA_BASE_URL, buildAuthHeaders } from '../common';

export const getAllTickers = createAction({
  name: 'get_all_tickers',
  auth: coinpaprikaAuth,
  displayName: 'Get All Tickers',
  description:
    'Fetch ticker data for all cryptocurrencies ranked by market cap. Returns prices, market caps, and 24h/7d changes.',
  props: {
    quotes: Property.ShortText({
      displayName: 'Quote Currencies',
      description:
        "Comma-separated list of fiat or crypto quote currencies (e.g. 'USD,BTC'). Defaults to USD.",
      required: false,
      defaultValue: 'USD',
    }),
  },
  async run(context) {
    const quotes = (context.propsValue.quotes ?? 'USD').trim() || 'USD';
    const url = `${COINPAPRIKA_BASE_URL}/tickers?quotes=${encodeURIComponent(quotes)}`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      headers: buildAuthHeaders(context.auth),
    });

    const data = response.body;
    if (!Array.isArray(data)) {
      throw new Error('Unexpected response from CoinPaprika: expected an array of tickers.');
    }

    return { tickers: data, count: data.length };
  },
});
