import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getSeiPrice = createAction({
  name: 'get-sei-price',
  displayName: 'Get SEI Price',
  description: 'Fetch the current SEI token price, market cap, and trading volume from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/sei-network',
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
    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      price_usd: currentPrice?.['usd'],
      market_cap_usd: marketCap?.['usd'],
      total_volume_usd: totalVolume?.['usd'],
      price_change_24h: (marketData?.['price_change_percentage_24h'] as number | undefined),
      price_change_7d: (marketData?.['price_change_percentage_7d'] as number | undefined),
      circulating_supply: marketData?.['circulating_supply'],
      total_supply: marketData?.['total_supply'],
      ath_usd: (marketData?.['ath'] as Record<string, unknown> | undefined)?.['usd'],
      last_updated: data['last_updated'],
    };
  },
});
