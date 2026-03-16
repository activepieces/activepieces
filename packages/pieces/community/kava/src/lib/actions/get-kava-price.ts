import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

interface CoinGeckoKavaResponse {
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

export const getKavaPriceAction = createAction({
  name: 'get-kava-price',
  displayName: 'Get KAVA Price',
  description: 'Get the current price and market data for the KAVA token from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<CoinGeckoKavaResponse>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/kava',
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
      price_change_24h_pct: marketData.price_change_percentage_24h,
      price_change_7d_pct: marketData.price_change_percentage_7d,
      circulating_supply: marketData.circulating_supply,
      total_supply: marketData.total_supply,
      ath_usd: marketData.ath['usd'],
      atl_usd: marketData.atl['usd'],
      last_updated: data.last_updated,
    };
  },
});
