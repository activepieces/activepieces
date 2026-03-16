import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getWPrice = createAction({
  name: 'get_w_price',
  displayName: 'Get W Token Price',
  description: 'Fetch the current price and market data for the Wormhole (W) governance token from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/wormhole',
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
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
      market_cap_usd: marketCap?.['usd'],
      total_volume_usd: totalVolume?.['usd'],
      price_change_24h: (marketData?.['price_change_percentage_24h'] as number | undefined),
      price_change_7d: (marketData?.['price_change_percentage_7d'] as number | undefined),
      circulating_supply: (marketData?.['circulating_supply'] as number | undefined),
      total_supply: (marketData?.['total_supply'] as number | undefined),
      last_updated: data['last_updated'],
    };
  },
});
