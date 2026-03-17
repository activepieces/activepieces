import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getIotaPrice = createAction({
  name: 'get_iota_price',
  displayName: 'Get IOTA Price',
  description: 'Fetch the current IOTA token price, market cap, and 24h volume from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/iota',
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
    const usd = (marketData?.['current_price'] as Record<string, unknown> | undefined)?.['usd'];
    const marketCap = (marketData?.['market_cap'] as Record<string, unknown> | undefined)?.['usd'];
    const volume24h = (marketData?.['total_volume'] as Record<string, unknown> | undefined)?.['usd'];
    const priceChange24h = marketData?.['price_change_percentage_24h'];

    return {
      id: data['id'],
      name: data['name'],
      symbol: data['symbol'],
      current_price_usd: usd,
      market_cap_usd: marketCap,
      total_volume_24h_usd: volume24h,
      price_change_percentage_24h: priceChange24h,
      last_updated: marketData?.['last_updated'],
    };
  },
});
