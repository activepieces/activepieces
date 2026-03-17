import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchCsToken } from '../claystack-api';

export const getCsPrice = createAction({
  name: 'get-cs-price',
  displayName: 'Get CS Token Price',
  description: 'Fetch the ClayStack CS governance token price, market cap, and 24h change from CoinGecko.',
  auth: undefined,
  props: {
    currency: Property.StaticDropdown({
      displayName: 'Currency',
      description: 'The currency to display price in',
      required: false,
      defaultValue: 'usd',
      options: {
        options: [
          { label: 'USD', value: 'usd' },
          { label: 'EUR', value: 'eur' },
          { label: 'BTC', value: 'btc' },
          { label: 'ETH', value: 'eth' },
        ],
      },
    }),
  },
  async run(context) {
    const currency = (context.propsValue.currency as string) || 'usd';
    const coin = await fetchCsToken();
    const md = coin.market_data;

    return {
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      currency: currency.toUpperCase(),
      price: md.current_price[currency] ?? null,
      price_formatted: md.current_price[currency]
        ? `${currency.toUpperCase()} ${md.current_price[currency].toFixed(6)}`
        : null,
      market_cap: md.market_cap[currency] ?? null,
      volume_24h: md.total_volume[currency] ?? null,
      price_change_24h_pct: md.price_change_percentage_24h ?? null,
      price_change_7d_pct: md.price_change_percentage_7d ?? null,
      circulating_supply: md.circulating_supply ?? null,
      total_supply: md.total_supply ?? null,
      last_updated: coin.last_updated,
      source: 'CoinGecko',
    };
  },
});
