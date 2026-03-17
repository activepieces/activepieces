import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

interface CoinGeckoResponse {
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
}

export const getSudoPrice = createAction({
  name: 'getSudoPrice',
  displayName: 'Get SUDO Price',
  description: 'Fetch current SUDO governance token price and market data via CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<CoinGeckoResponse>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/sudoswap',
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
      price_usd: marketData.current_price.usd,
      market_cap_usd: marketData.market_cap.usd,
      volume_24h_usd: marketData.total_volume.usd,
      price_change_24h_percent: marketData.price_change_percentage_24h,
      price_change_7d_percent: marketData.price_change_percentage_7d,
      circulating_supply: marketData.circulating_supply,
      total_supply: marketData.total_supply,
      ath_usd: marketData.ath.usd,
      atl_usd: marketData.atl.usd,
      last_updated: data.last_updated,
    };
  },
});
