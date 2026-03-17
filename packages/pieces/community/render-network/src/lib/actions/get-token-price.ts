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
    max_supply: number;
    ath: Record<string, number>;
    ath_date: Record<string, string>;
    atl: Record<string, number>;
    atl_date: Record<string, string>;
  };
  last_updated: string;
}

export const getTokenPrice = createAction({
  name: 'get_token_price',
  displayName: 'Get RENDER Token Price',
  description: 'Fetches the current RENDER token price and key market data from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<CoinGeckoResponse>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/render-token',
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
        sparkline: 'false',
      },
    });

    const data = response.body;
    const md = data.market_data;

    return {
      id: data.id,
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      price_usd: md.current_price['usd'],
      market_cap_usd: md.market_cap['usd'],
      total_volume_usd: md.total_volume['usd'],
      price_change_24h_percent: md.price_change_percentage_24h,
      price_change_7d_percent: md.price_change_percentage_7d,
      price_change_30d_percent: md.price_change_percentage_30d,
      circulating_supply: md.circulating_supply,
      total_supply: md.total_supply,
      max_supply: md.max_supply,
      all_time_high_usd: md.ath['usd'],
      all_time_high_date: md.ath_date['usd'],
      all_time_low_usd: md.atl['usd'],
      all_time_low_date: md.atl_date['usd'],
      last_updated: data.last_updated,
    };
  },
});
