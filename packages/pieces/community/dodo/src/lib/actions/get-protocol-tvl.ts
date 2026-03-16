import { createAction } from '@activepieces/pieces-framework';
import { fetchDefiLlama } from '../common/dodo-api';

export const getProtocolTvl = createAction({
  name: 'get-protocol-tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch DODO Protocol total value locked (TVL) from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const data = await fetchDefiLlama();

    const chainTvls: Record<string, number> = {};
    if (data.chainTvls) {
      for (const [chain, chainData] of Object.entries(data.chainTvls as Record<string, any>)) {
        const tvlArr = chainData.tvl;
        if (Array.isArray(tvlArr) && tvlArr.length > 0) {
          chainTvls[chain] = tvlArr[tvlArr.length - 1].totalLiquidityUSD;
        }
      }
    }

    const tvlHistory = data.tvl as Array<{ date: number; totalLiquidityUSD: number }>;
    const latestTvl = tvlHistory && tvlHistory.length > 0 ? tvlHistory[tvlHistory.length - 1].totalLiquidityUSD : 0;
    const prevTvl = tvlHistory && tvlHistory.length > 1 ? tvlHistory[tvlHistory.length - 2].totalLiquidityUSD : latestTvl;
    const tvlChange24h = prevTvl > 0 ? ((latestTvl - prevTvl) / prevTvl) * 100 : 0;

    return {
      totalTvl: latestTvl,
      tvlChange24h: Math.round(tvlChange24h * 100) / 100,
      chainTvls,
    };
  },
});