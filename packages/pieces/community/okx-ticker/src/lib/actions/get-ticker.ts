import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTickerAction = createAction({
  name: 'get_ticker',
  displayName: 'Get Ticker',
  description: 'Fetch real-time ticker data for a cryptocurrency from OKX',

  props: {
    symbol: Property.ShortText({
      displayName: 'Symbol',
      description: 'Trading pair symbol e.g. BTC-USDT, ETH-USDT',
      required: true,
      defaultValue: 'BTC-USDT',
    }),
  },

  async run(context) {
    const symbol = context.propsValue.symbol;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://www.okx.com/api/v5/market/ticker?instId=${encodeURIComponent(symbol)}`,
    });

    const ticker = response.body;

    if (ticker && ticker['code'] === '0' && ticker['data'] && ticker['data'].length > 0) {
      const data = ticker['data'][0];
      const last = parseFloat(data['last']);
      const open24h = parseFloat(data['open24h']);
      const change24h = open24h !== 0 ? ((last - open24h) / open24h) * 100 : 0;
      return {
        symbol: symbol,
        lastPrice: data['last'],
        high24h: data['high24h'],
        low24h: data['low24h'],
        volume24h: data['vol24h'],
        change24hPercent: change24h.toFixed(2),
        open24h: data['open24h'],
        timestamp: data['ts'],
      };
    }

    throw new Error(`Failed to fetch ticker for ${symbol}: ${JSON.stringify(ticker)}`);
  },
});
