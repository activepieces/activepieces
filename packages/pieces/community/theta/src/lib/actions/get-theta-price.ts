import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

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
    circulating_supply: number;
    total_supply: number;
    ath: Record<string, number>;
    atl: Record<string, number>;
  };
  last_updated: string;
}

export const getThetaPrice = createAction({
  name: 'get_theta_price',
  displayName: 'Get THETA Price',
  description:
    'Fetch the current price and market data for THETA (governance token) from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<CoinGeckoResponse>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/theta-token',
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
      },
    });

    const d = response.body;
    const md = d.market_data;
    return {
      id: d.id,
      symbol: d.symbol,
      name: d.name,
      price_usd: md.current_price['usd'],
      market_cap_usd: md.market_cap['usd'],
      volume_24h_usd: md.total_volume['usd'],
      price_change_24h_pct: md.price_change_percentage_24h,
      price_change_7d_pct: md.price_change_percentage_7d,
      circulating_supply: md.circulating_supply,
      total_supply: md.total_supply,
      ath_usd: md.ath['usd'],
      atl_usd: md.atl['usd'],
      last_updated: d.last_updated,
    };
  },
});
