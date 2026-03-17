import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getVetPrice = createAction({
  name: 'get_vet_price',
  displayName: 'Get VET Price',
  description: 'Get the current VET token price and market data from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/vechain',
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
    const usdData = (marketData?.['current_price'] as Record<string, unknown>) ?? {};

    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      current_price_usd: usdData['usd'],
      market_cap_usd: (marketData?.['market_cap'] as Record<string, unknown>)?.['usd'],
      total_volume_usd: (marketData?.['total_volume'] as Record<string, unknown>)?.['usd'],
      price_change_24h: marketData?.['price_change_24h'],
      price_change_percentage_24h: marketData?.['price_change_percentage_24h'],
      market_cap_rank: data['market_cap_rank'],
      circulating_supply: marketData?.['circulating_supply'],
      total_supply: marketData?.['total_supply'],
      max_supply: marketData?.['max_supply'],
      ath_usd: (marketData?.['ath'] as Record<string, unknown>)?.['usd'],
      last_updated: marketData?.['last_updated'],
    };
  },
});
