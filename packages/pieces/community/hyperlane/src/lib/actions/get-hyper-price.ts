import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getHyperPrice = createAction({
  name: 'get_hyper_price',
  displayName: 'Get HYPER Price',
  description: 'Get current HYPER token price and market data from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/hyperlane',
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
        sparkline: 'false',
      },
    });

    const data = response.body;
    const marketData = data['market_data'] as Record<string, unknown> | undefined;
    const currentPrice = marketData?.['current_price'] as Record<string, unknown> | undefined;
    const marketCap = marketData?.['market_cap'] as Record<string, unknown> | undefined;
    const totalVolume = marketData?.['total_volume'] as Record<string, unknown> | undefined;

    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      description: (data['description'] as Record<string, unknown> | undefined)?.['en'],
      current_price_usd: currentPrice?.['usd'],
      market_cap_usd: marketCap?.['usd'],
      total_volume_usd: totalVolume?.['usd'],
      price_change_percentage_24h: marketData?.['price_change_percentage_24h'],
      price_change_percentage_7d: marketData?.['price_change_percentage_7d'],
      price_change_percentage_30d: marketData?.['price_change_percentage_30d'],
      ath_usd: (marketData?.['ath'] as Record<string, unknown> | undefined)?.['usd'],
      circulating_supply: marketData?.['circulating_supply'],
      total_supply: marketData?.['total_supply'],
      last_updated: marketData?.['last_updated'],
    };
  },
});
