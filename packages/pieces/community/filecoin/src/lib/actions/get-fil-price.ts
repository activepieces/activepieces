import { createAction, Property } from '@activepieces/pieces-framework';
import { httpGet } from '../common/filecoin-api';

export const getFilPrice = createAction({
  name: 'getFilPrice',
  displayName: 'Get FIL Price',
  description:
    'Get the current Filecoin (FIL) price, market cap, and 24h volume from CoinGecko.',
  props: {
    currency: Property.ShortText({
      displayName: 'Currency',
      description:
        'The target currency for price data (e.g., usd, eur, btc). Defaults to usd.',
      required: false,
      defaultValue: 'usd',
    }),
  },
  async run(context) {
    const currency = (context.propsValue.currency ?? 'usd').toLowerCase();

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=filecoin&vs_currencies=${currency}&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`;

    const response = (await httpGet(url)) as Record<string, unknown>;

    if (!response || !response['filecoin']) {
      throw new Error('Failed to fetch FIL price data from CoinGecko.');
    }

    const data = response['filecoin'] as Record<string, unknown>;

    return {
      token: 'FIL',
      currency: currency.toUpperCase(),
      price: data[currency],
      marketCap: data[`${currency}_market_cap`],
      volume24h: data[`${currency}_24h_vol`],
      priceChange24h: data[`${currency}_24h_change`],
      lastUpdated: data['last_updated_at']
        ? new Date(
            (data['last_updated_at'] as number) * 1000
          ).toISOString()
        : null,
    };
  },
});
