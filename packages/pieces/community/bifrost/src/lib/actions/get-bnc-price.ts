import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getBncPrice = createAction({
  name: 'get_bnc_price',
  displayName: 'Get BNC Price',
  description: 'Fetch the current price and market data for BNC (Bifrost Native Coin) from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/bifrost-native-coin',
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
        sparkline: 'false',
      },
    });

    const data = response.body as Record<string, unknown>;
    const marketData = (data['market_data'] ?? {}) as Record<string, unknown>;
    const currentPrice = (marketData['current_price'] ?? {}) as Record<string, unknown>;
    const marketCap = (marketData['market_cap'] ?? {}) as Record<string, unknown>;
    const totalVolume = (marketData['total_volume'] ?? {}) as Record<string, unknown>;

    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      price_usd: currentPrice['usd'],
      market_cap_usd: marketCap['usd'],
      total_volume_usd: totalVolume['usd'],
      price_change_24h: marketData['price_change_24h'],
      price_change_percentage_24h: marketData['price_change_percentage_24h'],
      circulating_supply: marketData['circulating_supply'],
      total_supply: marketData['total_supply'],
      last_updated: marketData['last_updated'],
    };
  },
});
