import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getIntrPrice = createAction({
  name: 'get-intr-price',
  displayName: 'Get INTR Price',
  description:
    'Get the current price, market cap, and 24h volume of the INTR governance token from CoinGecko.',
  auth: undefined,
  props: {
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'Fiat currency for price display (e.g. usd, eur, gbp)',
      required: false,
      defaultValue: 'usd',
    }),
  },
  async run(context) {
    const currency = (context.propsValue['currency'] || 'usd').toLowerCase();
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/interlay',
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
      },
    });
    const data = response.body as Record<string, unknown>;
    const marketData = data['market_data'] as Record<string, unknown>;
    const currentPrice = marketData['current_price'] as Record<string, number>;
    const marketCap = marketData['market_cap'] as Record<string, number>;
    const totalVolume = marketData['total_volume'] as Record<string, number>;
    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      price: currentPrice[currency],
      market_cap: marketCap[currency],
      total_volume: totalVolume[currency],
      price_change_24h_pct: marketData['price_change_percentage_24h'],
      price_change_7d_pct: marketData['price_change_percentage_7d'],
      circulating_supply: marketData['circulating_supply'],
      total_supply: marketData['total_supply'],
      last_updated: marketData['last_updated'],
    };
  },
});
