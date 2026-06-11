import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

export const fetchCryptoPairPrice = createAction({
  name: 'fetch_crypto_pair_price',
  displayName: 'Fetch Pair Price',
  description: 'Fetch the current price of a pair (e.g. BTC/USDT)',
  audience: 'both',
  aiMetadata: { description: 'Fetches the current spot price of a trading pair from the public Binance market data API by combining two coin symbols (e.g. first coin BTC + second coin USDT). Use to look up the live exchange rate of one crypto asset against another. No authentication required; the symbol must be a pair that exists on Binance or the request fails. Read-only lookup, idempotent.', idempotent: true },
  props: {
    first_coin: Property.ShortText({
      displayName: 'First Coin Symbol',
      description:
        "The currency to fetch the price for (e.g. 'BTC' in 'BTC/USDT')",
      required: true,
    }),
    second_coin: Property.ShortText({
      displayName: 'Second Coin Symbol',
      description:
        "The currency to fetch the price in (e.g. 'USDT' in 'BTC/USDT')",
      required: true,
    }),
  },
  async run(context) {
    const { first_coin, second_coin } = context.propsValue;
    if (first_coin && second_coin)
      return await fetchCryptoPairPriceImpl(`${first_coin}${second_coin}`);
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
