import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getKmnoPrice = createAction({
  name: 'get_kmno_price',
  displayName: 'Get KMNO Price',
  description: 'Fetch the current price and market data for the KMNO governance token from CoinGecko.',
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
      };
    }>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/kamino',
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
      },
    });

    const data = response.body;
    const marketData = data.market_data;

    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      priceUSD: marketData?.current_price?.usd ?? null,
      marketCapUSD: marketData?.market_cap?.usd ?? null,
      volume24hUSD: marketData?.total_volume?.usd ?? null,
      priceChange24hPercent: marketData?.price_change_percentage_24h ?? null,
      priceChange7dPercent: marketData?.price_change_percentage_7d ?? null,
      circulatingSupply: marketData?.circulating_supply ?? null,
      totalSupply: marketData?.total_supply ?? null,
    };
  },
});
