import { createAction, Property } from '@activepieces/pieces-framework';
import { binanceClient } from '../common/client';
import { binanceInput } from '../common/input';

export const fetchCryptoPairPrice = createAction({
  name: 'fetch_crypto_pair_price',
  classification: 'READ',
  displayName: 'Fetch Pair Price',
  description: 'Fetch the current price of a pair (e.g. BTC/USDT)',
  audience: 'human',
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
    const first = binanceInput.symbol({ value: first_coin, fieldName: 'First Coin Symbol' });
    const second = binanceInput.symbol({ value: second_coin, fieldName: 'Second Coin Symbol' });
    return await fetchCryptoPairPriceImpl({ symbol: `${first}${second}` });
  },
});

async function fetchCryptoPairPriceImpl({ symbol }: { symbol: string }): Promise<number> {
  const data = await binanceClient.get<{ price?: string }>({
    path: '/ticker/price',
    queryParams: { symbol },
    subject: `the trading pair "${symbol}"`,
  });
  const raw = data?.price;
  const price = typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : NaN;
  if (!Number.isFinite(price)) {
    throw new Error(`Binance returned no price for ${symbol}.`);
  }
  return price;
}
