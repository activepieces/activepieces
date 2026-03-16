import { createAction } from '@activepieces/pieces-framework';
import { getProtocolTvl, getCoinMarketData } from '../pickle-api';

export const getYieldStats = createAction({
  name: 'get_yield_stats',
  displayName: 'Get Yield Stats',
  description: 'Aggregates Pickle Finance yield statistics: protocol TVL from DeFiLlama combined with PICKLE market cap and token data from CoinGecko, providing a full picture of protocol health and yield context.',
  props: {},
  async run() {
    const [protocol, market] = await Promise.all([getProtocolTvl(), getCoinMarketData()]);

    const mcap = market.market_data.market_cap.usd;
    const tvl = protocol.tvl;
    const mcapToTvl = tvl > 0 ? mcap / tvl : null;

    return {
      protocol: {
        name: protocol.name,
        tvl_usd: tvl,
        tvl_change_1d: protocol.change_1d,
        tvl_change_7d: protocol.change_7d,
        chains: protocol.chains,
        category: protocol.category,
      },
      token: {
        symbol: market.symbol.toUpperCase(),
        price_usd: market.market_data.current_price.usd,
        market_cap_usd: mcap,
        volume_24h_usd: market.market_data.total_volume.usd,
        price_change_24h_pct: market.market_data.price_change_percentage_24h,
        circulating_supply: market.market_data.circulating_supply,
      },
      metrics: {
        mcap_to_tvl_ratio: mcapToTvl,
        tvl_prev_day_usd: protocol.tvlPrevDay,
        tvl_prev_week_usd: protocol.tvlPrevWeek,
        tvl_prev_month_usd: protocol.tvlPrevMonth,
      },
    };
  },
});
