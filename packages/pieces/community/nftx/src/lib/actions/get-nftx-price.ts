import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

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
}

export const getNftxPrice = createAction({
  name: 'get_nftx_price',
  displayName: 'Get NFTX Token Price',
  description: 'Fetch the current NFTX governance token price, market cap, and trading volume from CoinGecko.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<CoinGeckoResponse>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/nftx',
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
        sparkline: 'false',
      },
    });
    const d = response.body;
    return {
      id: d.id,
      symbol: d.symbol,
      name: d.name,
      price_usd: d.market_data.current_price.usd,
      market_cap_usd: d.market_data.market_cap.usd,
      volume_24h_usd: d.market_data.total_volume.usd,
      price_change_24h_pct: d.market_data.price_change_percentage_24h,
      price_change_7d_pct: d.market_data.price_change_percentage_7d,
      circulating_supply: d.market_data.circulating_supply,
      total_supply: d.market_data.total_supply,
      ath_usd: d.market_data.ath.usd,
      atl_usd: d.market_data.atl.usd,
    };
  },
});
