import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getAlgoPrice = createAction({
  name: 'get_algo_price',
  displayName: 'Get ALGO Price',
  description:
    'Fetch current ALGO price, market cap, 24h volume, and price change data from CoinGecko.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/algorand',
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
      },
    });
    const data = response.body as Record<string, any>;
    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      current_price_usd: data['market_data']?.['current_price']?.['usd'],
      market_cap_usd: data['market_data']?.['market_cap']?.['usd'],
      total_volume_usd: data['market_data']?.['total_volume']?.['usd'],
      price_change_24h: data['market_data']?.['price_change_24h'],
      price_change_percentage_24h: data['market_data']?.['price_change_percentage_24h'],
      price_change_percentage_7d: data['market_data']?.['price_change_percentage_7d'],
      circulating_supply: data['market_data']?.['circulating_supply'],
      total_supply: data['market_data']?.['total_supply'],
      last_updated: data['last_updated'],
    };
  },
});
