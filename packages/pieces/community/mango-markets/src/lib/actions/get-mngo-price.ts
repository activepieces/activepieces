import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getMngoPrice = createAction({
  name: 'get_mngo_price',
  displayName: 'Get MNGO Price',
  description: 'Get the current MNGO governance token price, market cap, and 24h change from CoinGecko.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/mango-markets?localization=false&tickers=false&community_data=false&developer_data=false',
    });

    const data = response.body as Record<string, unknown>;
    const market = (data['market_data'] ?? {}) as Record<string, unknown>;
    const currentPrice = (market['current_price'] ?? {}) as Record<string, number>;
    const marketCap = (market['market_cap'] ?? {}) as Record<string, number>;
    const totalVolume = (market['total_volume'] ?? {}) as Record<string, number>;

    return {
      priceUsd: currentPrice['usd'] ?? null,
      marketCapUsd: marketCap['usd'] ?? null,
      priceChange24hPercent: (market['price_change_percentage_24h'] as number) ?? null,
      volume24hUsd: totalVolume['usd'] ?? null,
      circulatingSupply: (market['circulating_supply'] as number) ?? null,
      totalSupply: (market['total_supply'] as number) ?? null,
      lastUpdated: (market['last_updated'] as string) ?? null,
    };
  },
});
