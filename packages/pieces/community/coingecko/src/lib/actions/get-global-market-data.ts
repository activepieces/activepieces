import { createAction } from '@activepieces/pieces-framework';
import { coingeckoAuth } from '../..';
import { coingeckoRequest } from '../common/coingecko-api';

interface GlobalData {
  data: {
    active_cryptocurrencies: number;
    upcoming_icos: number;
    ongoing_icos: number;
    ended_icos: number;
    markets: number;
    total_market_cap: Record<string, number>;
    total_volume: Record<string, number>;
    market_cap_percentage: Record<string, number>;
    market_cap_change_percentage_24h_usd: number;
    updated_at: number;
  };
}

export const getGlobalMarketData = createAction({
  name: 'get_global_market_data',
  displayName: 'Get Global Market Data',
  description:
    'Get global cryptocurrency market statistics including total market cap, BTC dominance, and active cryptocurrencies.',
  auth: coingeckoAuth,
  requireAuth: false,
  props: {},
  async run({ auth }) {
    const response = await coingeckoRequest<GlobalData>(
      auth as string | undefined,
      '/global'
    );

    const data = response.data;

    return {
      active_cryptocurrencies: data.active_cryptocurrencies,
      markets: data.markets,
      total_market_cap_usd: data.total_market_cap['usd'],
      total_volume_usd: data.total_volume['usd'],
      btc_dominance: data.market_cap_percentage['btc'],
      eth_dominance: data.market_cap_percentage['eth'],
      market_cap_change_24h_pct: data.market_cap_change_percentage_24h_usd,
      updated_at: data.updated_at,
    };
  },
});
