import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface CoinGeckoResponse {
  id: string;
  symbol: string;
  name: string;
  market_data: {
    current_price: Record<string, number>;
    market_cap: Record<string, number>;
    total_volume: Record<string, number>;
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    price_change_percentage_30d: number;
    circulating_supply: number;
    total_supply: number;
    max_supply: number | null;
  };
  last_updated: string;
}

export const getSocketPrice = createAction({
  name: 'get_socket_price',
  displayName: 'Get SOCKET Token Price',
  description:
    'Fetches the current SOCKET governance token price and market data from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<CoinGeckoResponse>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/socket',
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
      price_usd: marketData.current_price['usd'],
      market_cap_usd: marketData.market_cap['usd'],
      total_volume_usd: marketData.total_volume['usd'],
      price_change_24h_percent: marketData.price_change_percentage_24h,
      price_change_7d_percent: marketData.price_change_percentage_7d,
      price_change_30d_percent: marketData.price_change_percentage_30d,
      circulating_supply: marketData.circulating_supply,
      total_supply: marketData.total_supply,
      max_supply: marketData.max_supply,
      last_updated: data.last_updated,
    };
  },
});
