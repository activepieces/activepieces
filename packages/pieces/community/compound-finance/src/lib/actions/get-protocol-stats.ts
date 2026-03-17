import { createAction } from '@activepieces/pieces-framework';
import { getProtocolTVL, getTokenPrice } from '../compound-finance-api';

export const getProtocolStatsAction = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Returns a combined summary of Compound Finance protocol metrics and COMP token data.',
  auth: undefined,
  props: {},
  async run() {
    const [protocolData, tokenData] = await Promise.all([
      getProtocolTVL(),
      getTokenPrice(),
    ]);
    return {
      protocol: {
        name: protocolData.name,
        tvl_usd: protocolData.tvl,
        change_1h_percent: protocolData.change_1h,
        change_1d_percent: protocolData.change_1d,
        change_7d_percent: protocolData.change_7d,
        supported_chains: protocolData.chains,
        url: protocolData.url,
      },
      token: {
        symbol: tokenData.symbol,
        price_usd: tokenData.current_price,
        market_cap_usd: tokenData.market_cap,
        volume_24h_usd: tokenData.total_volume,
        price_change_24h_percent: tokenData.price_change_percentage_24h,
        circulating_supply: tokenData.circulating_supply,
        fully_diluted_valuation: tokenData.total_supply && tokenData.current_price
          ? tokenData.total_supply * tokenData.current_price
          : null,
      },
      summary: {
        tvl_to_mcap_ratio: protocolData.tvl && tokenData.market_cap && tokenData.market_cap > 0
          ? parseFloat((protocolData.tvl / tokenData.market_cap).toFixed(4))
          : null,
      },
    };
  },
});
