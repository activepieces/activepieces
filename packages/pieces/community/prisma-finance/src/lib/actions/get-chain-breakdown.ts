import { createAction } from '@activepieces/pieces-framework';
import { getProtocolData, formatUSD } from '../prisma-finance-api';

export const getChainBreakdownAction = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description:
    'Returns Prisma Finance TVL broken down by blockchain, sorted in descending order, with each chain\'s percentage of total TVL.',
  props: {},
  async run() {
    const data = await getProtocolData();

    const chainTvls = data.chainTvls || {};
    const totalTvl = data.tvl;

    const chains = Object.entries(chainTvls)
      .map(([chain, tvl]) => ({
        chain,
        tvl: tvl as number,
        tvlFormatted: formatUSD(tvl as number),
        percentOfTotal:
          totalTvl > 0
            ? parseFloat((((tvl as number) / totalTvl) * 100).toFixed(2))
            : 0,
      }))
      .sort((a, b) => b.tvl - a.tvl);

    return {
      totalTvl,
      totalTvlFormatted: formatUSD(totalTvl),
      chainCount: chains.length,
      chains,
    };
  },
});
