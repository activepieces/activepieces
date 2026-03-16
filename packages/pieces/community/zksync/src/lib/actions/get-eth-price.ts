import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getEthPrice = createAction({
  name: 'get-eth-price',
  displayName: 'Get ETH Price',
  description: 'Fetch the current ETH price from CoinGecko. ETH is the native gas token on zkSync Era.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/ethereum',
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
        sparkline: 'false',
      },
    });

    const data = response.body as Record<string, unknown>;
    const marketData = data['market_data'] as Record<string, unknown>;
    const currentPrice = marketData['current_price'] as Record<string, unknown>;
    const priceChange = marketData['price_change_percentage_24h'];
    const marketCap = (marketData['market_cap'] as Record<string, unknown>)?.['usd'];
    const volume24h = (marketData['total_volume'] as Record<string, unknown>)?.['usd'];
    const ath = (marketData['ath'] as Record<string, unknown>)?.['usd'];

    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      price_usd: currentPrice?.['usd'],
      price_change_24h_pct: priceChange,
      market_cap_usd: marketCap,
      volume_24h_usd: volume24h,
      all_time_high_usd: ath,
      last_updated: marketData['last_updated'],
    };
  },
});
