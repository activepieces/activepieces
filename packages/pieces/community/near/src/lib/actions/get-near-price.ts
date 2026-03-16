import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getNearPrice = createAction({
  name: 'get_near_price',
  displayName: 'Get NEAR Price',
  description: 'Fetch the current NEAR token price and market data from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      id: string;
      symbol: string;
      name: string;
      market_data: {
        current_price: { usd: number };
        market_cap: { usd: number };
        total_volume: { usd: number };
        price_change_percentage_24h: number;
        price_change_percentage_7d: number;
        circulating_supply: number;
        total_supply: number;
        ath: { usd: number };
        atl: { usd: number };
      };
      last_updated: string;
    }>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/near',
    });
    const data = response.body;
    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      currentPriceUsd: data.market_data.current_price.usd,
      marketCapUsd: data.market_data.market_cap.usd,
      totalVolumeUsd: data.market_data.total_volume.usd,
      priceChangePercentage24h: data.market_data.price_change_percentage_24h,
      priceChangePercentage7d: data.market_data.price_change_percentage_7d,
      circulatingSupply: data.market_data.circulating_supply,
      totalSupply: data.market_data.total_supply,
      athUsd: data.market_data.ath.usd,
      atlUsd: data.market_data.atl.usd,
      lastUpdated: data.last_updated,
    };
  },
});
