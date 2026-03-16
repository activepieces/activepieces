import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getSommPrice = createAction({
  name: 'get_somm_price',
  displayName: 'Get SOMM Price',
  description:
    'Fetch the current price and market data for the SOMM token from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      id: string;
      symbol: string;
      name: string;
      market_data: {
        current_price: Record<string, number>;
        market_cap: Record<string, number>;
        total_volume: Record<string, number>;
        price_change_percentage_24h: number;
        price_change_percentage_7d: number;
        circulating_supply: number;
        total_supply: number;
        max_supply: number;
      };
    }>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/sommelier',
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
        sparkline: 'false',
      },
    });

    const data = response.body;
    const marketData = data.market_data;

    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      priceUsd: marketData.current_price['usd'],
      marketCapUsd: marketData.market_cap['usd'],
      volume24hUsd: marketData.total_volume['usd'],
      priceChange24h: marketData.price_change_percentage_24h,
      priceChange7d: marketData.price_change_percentage_7d,
      circulatingSupply: marketData.circulating_supply,
      totalSupply: marketData.total_supply,
      maxSupply: marketData.max_supply,
    };
  },
});
