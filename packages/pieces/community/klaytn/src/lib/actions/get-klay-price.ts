import { createAction } from '@activepieces/pieces-framework';
import { fetchCoinGecko } from '../klaytn-api';

export const getKlayPriceAction = createAction({
  auth: undefined,
  name: 'get_klay_price',
  displayName: 'Get KLAY Price',
  description:
    'Fetch the current KLAY token price and market data from CoinGecko.',
  props: {},
  async run() {
    const data = await fetchCoinGecko<{
      id: string;
      symbol: string;
      name: string;
      market_data: {
        current_price: Record<string, number>;
        market_cap: Record<string, number>;
        total_volume: Record<string, number>;
        price_change_percentage_24h: number;
      };
    }>('/coins/klay-token', {
      localization: 'false',
      tickers: 'false',
      community_data: 'false',
      developer_data: 'false',
      sparkline: 'false',
    });
    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      price_usd: data.market_data?.current_price?.usd,
      market_cap_usd: data.market_data?.market_cap?.usd,
      volume_24h_usd: data.market_data?.total_volume?.usd,
      price_change_24h_pct: data.market_data?.price_change_percentage_24h,
    };
  },
});
