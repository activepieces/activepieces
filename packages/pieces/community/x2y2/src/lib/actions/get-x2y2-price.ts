import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getX2y2PriceAction = createAction({
  name: 'get-x2y2-price',
  displayName: 'Get X2Y2 Token Price',
  description: 'Fetch the current X2Y2 token price and market data from CoinGecko.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/x2y2',
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
      priceUsd: currentPrice?.['usd'],
      marketCapUsd: marketCap?.['usd'],
      totalVolumeUsd: totalVolume?.['usd'],
      priceChangePercentage24h: marketData?.['price_change_percentage_24h'],
      circulatingSupply: marketData?.['circulating_supply'],
      totalSupply: marketData?.['total_supply'],
      lastUpdated: marketData?.['last_updated'],
    };
  },
});
