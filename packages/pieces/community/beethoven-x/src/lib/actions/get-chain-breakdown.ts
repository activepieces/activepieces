import { createAction } from '@activepieces/pieces-framework';
import { getBeethovenProtocol } from '../common/beethoven-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Get Beethoven X TVL breakdown by blockchain, sorted by value descending.',
  props: {},
  async run() {
    const data = await getBeethovenProtocol();

    const chainTvls: Record<string, number> = data.currentChainTvls ?? {};

    const chains = Object.entries(chainTvls)
      .map(([chain, tvl]) => ({ chain, tvlUsd: tvl }))
      .sort((a, b) => b.tvlUsd - a.tvlUsd);

    const totalTvl = chains.reduce((sum, c) => sum + c.tvlUsd, 0);

    return {
      chains: chains.map((c) => ({
        chain: c.chain,
        tvlUsd: c.tvlUsd,
        share: totalTvl > 0 ? ((c.tvlUsd / totalTvl) * 100).toFixed(2) + '%' : '0%',
      })),
      totalTvlUsd: totalTvl,
      chainCount: chains.length,
    };
  },
});
