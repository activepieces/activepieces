import { createAction } from '../../../framework/action/action';
import { HttpMethod } from '../../../common/http/core/http-method';
import { httpClient } from '../../../common/http/core/http-client';
import { Property } from '../../../framework/property';

export const fetchCryptoPairPrice = createAction({
  name: 'fetch_crypto_pair_price',
  displayName: 'Fetch Pair Price',
  description: 'Fetch the current price of a pair (e.g. BTC/USDT)',
  props: {
    symbol: Property.ShortText({
      displayName: 'Symbol',
      description:
        "The currency to fetch the price for (e.g. 'BTC' in 'BTC/USDT')",
      required: true,
    }),
    vol: Property.ShortText({
      displayName: 'Vol',
      description:
        "The currency to fetch the price in (e.g. 'USDT' in 'BTC/USDT')",
      required: true,
    }),
  },
  async run(context) {
    const { symbol, vol } = context.propsValue;
    if (symbol && vol) return await fetchCryptoPairPriceImpl(`${symbol}${vol}`);
    throw Error('Missing parameter(s)');
  },
});

async function fetchCryptoPairPriceImpl(symbol: string): Promise<number> {
  const formattedSymbol = symbol
    .replace('/', '')
    .replace(' ', '')
    .toUpperCase();

  const url = `https://api.binance.com/api/v3/ticker/price?symbol=${formattedSymbol}`;

  try {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
    });
    const data = await response.body;
    return Number(data['price']);
  } catch (error) {
    console.error(`Error fetching price for symbol ${symbol}:`, error);
    throw error;
  }
}
