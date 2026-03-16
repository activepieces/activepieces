import { createAction } from '@activepieces/pieces-framework';
import { coinGeckoRequest } from '../fantom-api';

interface CoinGeckoFantomResponse {
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
    atl: Record<string, number>;
  };
}

export const getFtmPrice = createAction({
  name: 'get_ftm_price',
  displayName: 'Get FTM Price',
  description: 'Fetch the current FTM (Fantom) token price, market cap, volume, and price changes from CoinGecko.',
  props: {},
  async run() {
    const data = await coinGeckoRequest<CoinGeckoFantomResponse>(
      '/coins/fantom?localization=false&tickers=false&community_data=false&developer_data=false'
    );
    const md = data.market_data;
    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      price_usd: md.current_price['usd'],
      market_cap_usd: md.market_cap['usd'],
      total_volume_usd: md.total_volume['usd'],
      price_change_24h_pct: md.price_change_percentage_24h,
      price_change_7d_pct: md.price_change_percentage_7d,
      price_change_30d_pct: md.price_change_percentage_30d,
      circulating_supply: md.circulating_supply,
      total_supply: md.total_supply,
      max_supply: md.max_supply,
      ath_usd: md.ath['usd'],
      atl_usd: md.atl['usd'],
    };
  },
});
