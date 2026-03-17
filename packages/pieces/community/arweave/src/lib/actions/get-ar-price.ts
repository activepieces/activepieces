import { createAction, Property } from '@activepieces/pieces-framework';

export const getArPrice = createAction({
  name: 'getArPrice',
  displayName: 'Get AR Token Price',
  description: 'Fetch the current price of the AR token from CoinGecko.',
  auth: undefined,
  props: {
    currency: Property.StaticDropdown({
      displayName: 'Currency',
      description: 'The fiat currency to display the price in.',
      required: true,
      defaultValue: 'usd',
      options: {
        options: [
          { label: 'USD', value: 'usd' },
          { label: 'EUR', value: 'eur' },
          { label: 'GBP', value: 'gbp' },
          { label: 'BTC', value: 'btc' },
          { label: 'ETH', value: 'eth' },
        ],
      },
    }),
  },
  async run(context) {
    const { currency } = context.propsValue;

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=${currency}&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as Record<string, Record<string, number>>;
    const arData = data['arweave'];
    if (!arData) {
      throw new Error('Failed to retrieve AR price data from CoinGecko.');
    }

    return {
      token: 'AR',
      currency: currency.toUpperCase(),
      price: arData[currency],
      market_cap: arData[`${currency}_market_cap`],
      volume_24h: arData[`${currency}_24h_vol`],
      change_24h: arData[`${currency}_24h_change`],
      last_updated_at: arData['last_updated_at'],
    };
  },
});
