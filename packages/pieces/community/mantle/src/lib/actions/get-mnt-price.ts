import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getMntPrice = createAction({
  name: 'get_mnt_price',
  displayName: 'Get MNT Price',
  description: 'Get the current MNT token price, market cap, and 24h volume from CoinGecko.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/mantle',
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
    const currentPrice = marketData?.['current_price'] as Record<string, unknown> | undefined;
    const marketCap = marketData?.['market_cap'] as Record<string, unknown> | undefined;
    const totalVolume = marketData?.['total_volume'] as Record<string, unknown> | undefined;
    const priceChange24h = marketData?.['price_change_percentage_24h'];

    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      price_usd: currentPrice?.['usd'],
      market_cap_usd: marketCap?.['usd'],
      total_volume_usd: totalVolume?.['usd'],
      price_change_24h_percent: priceChange24h,
      last_updated: marketData?.['last_updated'],
    };
  },
});
