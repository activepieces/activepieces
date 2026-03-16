import { createAction } from '@activepieces/pieces-framework';
import { getAxelarProtocol } from '../axelar-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Get key statistics for Axelar Network including TVL, supported chains, and protocol category',
  auth: undefined,
  props: {},
  async run() {
    const data = await getAxelarProtocol();
    const chainTvls = data.chainTvls || {};
    const chains = Object.keys(chainTvls);
    const tvlHistory: Array<{ date: number; totalLiquidityUSD: number }> = data.tvl || [];
    const latestTvl = tvlHistory.length > 0 ? tvlHistory[tvlHistory.length - 1]?.totalLiquidityUSD : data.tvl;
    const prevTvl = tvlHistory.length > 1 ? tvlHistory[tvlHistory.length - 2]?.totalLiquidityUSD : null;
    const tvlChange24h = latestTvl && prevTvl ? ((latestTvl - prevTvl) / prevTvl) * 100 : null;

    return {
      name: data.name,
      category: data.category,
      tvl_usd: latestTvl,
      tvl_change_24h_pct: tvlChange24h ? parseFloat(tvlChange24h.toFixed(2)) : null,
      chain_count: chains.length,
      chains,
      url: data.url,
      twitter: data.twitter,
    };
  },
});
