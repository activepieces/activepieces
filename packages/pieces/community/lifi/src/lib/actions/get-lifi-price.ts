import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getLifiPriceAction = createAction({
  name: 'get_lifi_price',
  displayName: 'Get LIFI Token Price',
  description: 'Fetch current LIFI governance token price and market data from CoinGecko.',
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
        ath: Record<string, number>;
        atl: Record<string, number>;
      };
    }>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/li-finance',
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
      symbol: data.symbol,
      name: data.name,
      price_usd: md.current_price['usd'],
      market_cap_usd: md.market_cap['usd'],
      volume_24h_usd: md.total_volume['usd'],
      price_change_24h_pct: md.price_change_percentage_24h,
      price_change_7d_pct: md.price_change_percentage_7d,
      circulating_supply: md.circulating_supply,
      total_supply: md.total_supply,
      ath_usd: md.ath['usd'],
      atl_usd: md.atl['usd'],
    };
  },
});
