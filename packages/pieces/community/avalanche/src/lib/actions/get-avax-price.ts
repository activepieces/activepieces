import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

export const getAvaxPriceAction = createAction({
  name: 'get_avax_price',
  displayName: 'Get AVAX Price',
  description:
    'Fetch the current price and market data for AVAX (Avalanche native token) from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/avalanche-2',
    });

    const data = response.body as Record<string, unknown>;
    const marketData = data['market_data'] as Record<string, unknown> | undefined;
    const usd = (marketData?.['current_price'] as Record<string, number> | undefined)?.['usd'];
    const marketCap = (marketData?.['market_cap'] as Record<string, number> | undefined)?.['usd'];
    const volume24h = (marketData?.['total_volume'] as Record<string, number> | undefined)?.['usd'];
    const change24h = marketData?.['price_change_percentage_24h'] as number | undefined;
    const change7d = marketData?.['price_change_percentage_7d'] as number | undefined;

    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      currentPriceUsd: usd,
      marketCapUsd: marketCap,
      totalVolume24hUsd: volume24h,
      priceChangePercentage24h: change24h,
      priceChangePercentage7d: change7d,
      lastUpdated: (marketData?.['last_updated'] as string | undefined),
    };
  },
});
