import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getOrcaPrice = createAction({
  name: 'getOrcaPrice',
  displayName: 'Get ORCA Price',
  description:
    'Fetch the current ORCA token price, market cap, and 24h trading volume from CoinGecko.',
  props: {},
  auth: undefined,
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/orca',
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
        sparkline: 'false',
      },
    });

    const data = response.body;
    const marketData = data['market_data'] as Record<string, unknown>;
    const currentPrice = marketData['current_price'] as Record<string, number>;
    const marketCap = marketData['market_cap'] as Record<string, number>;
    const totalVolume = marketData['total_volume'] as Record<string, number>;
    const priceChange24h = marketData[
      'price_change_percentage_24h'
    ] as number;

    return {
      id: data['id'],
      name: data['name'],
      symbol: data['symbol'],
      priceUSD: currentPrice['usd'],
      marketCapUSD: marketCap['usd'],
      volume24hUSD: totalVolume['usd'],
      priceChange24hPercent: priceChange24h,
      lastUpdated: data['last_updated'],
    };
  },
});
