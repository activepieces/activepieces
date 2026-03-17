import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

export const getXtzPrice = createAction({
  name: 'get_xtz_price',
  displayName: 'Get XTZ Price',
  description: 'Fetch the current XTZ price, market cap, and 24h trading volume via CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/tezos',
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
        sparkline: 'false',
      },
    });

    const data = response.body as Record<string, unknown>;
    const marketData = data['market_data'] as Record<string, unknown> | undefined;
    const currentPrice = marketData?.['current_price'] as Record<string, number> | undefined;
    const marketCap = marketData?.['market_cap'] as Record<string, number> | undefined;
    const totalVolume = marketData?.['total_volume'] as Record<string, number> | undefined;

    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      price_usd: currentPrice?.['usd'],
      price_btc: currentPrice?.['btc'],
      market_cap_usd: marketCap?.['usd'],
      total_volume_usd: totalVolume?.['usd'],
      price_change_24h: marketData?.['price_change_percentage_24h'],
      price_change_7d: marketData?.['price_change_percentage_7d'],
      circulating_supply: marketData?.['circulating_supply'],
      total_supply: marketData?.['total_supply'],
      last_updated: marketData?.['last_updated'],
    };
  },
});
