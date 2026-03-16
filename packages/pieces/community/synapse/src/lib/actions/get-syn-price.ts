import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

export const getSynPrice = createAction({
  name: 'get_syn_price',
  displayName: 'Get SYN Price',
  description: 'Fetch the current price and market data for the SYN governance token from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/synapse-2',
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
    const priceChange = marketData?.['price_change_percentage_24h'];
    const marketCap = marketData?.['market_cap'] as Record<string, number> | undefined;
    const totalVolume = marketData?.['total_volume'] as Record<string, number> | undefined;
    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      price_usd: currentPrice?.['usd'],
      price_change_24h_pct: priceChange,
      market_cap_usd: marketCap?.['usd'],
      total_volume_usd: totalVolume?.['usd'],
      last_updated: data['last_updated'],
    };
  },
});
