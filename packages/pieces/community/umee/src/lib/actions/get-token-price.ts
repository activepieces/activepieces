import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTokenPrice = createAction({
  name: 'get-token-price',
  displayName: 'Get Token Price',
  description:
    'Fetch the current price and market data for the UMEE token from CoinGecko.',
  auth: undefined,
  props: {
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'The target currency for the price (e.g. usd, eur, btc).',
      required: false,
      defaultValue: 'usd',
    }),
  },
  async run(ctx) {
    const currency = (ctx.propsValue.currency as string) || 'usd';
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/umee',
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
        sparkline: 'false',
      },
    });
    const data = response.body as Record<string, any>;
    const marketData = (data['market_data'] as Record<string, any>) || {};
    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      current_price: marketData['current_price']?.[currency],
      market_cap: marketData['market_cap']?.[currency],
      total_volume: marketData['total_volume']?.[currency],
      price_change_24h: marketData['price_change_24h'],
      price_change_percentage_24h: marketData['price_change_percentage_24h'],
      circulating_supply: marketData['circulating_supply'],
      total_supply: marketData['total_supply'],
      last_updated: data['last_updated'],
    };
  },
});
