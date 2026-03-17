import { createAction } from '@activepieces/pieces-framework';
import { fetchProtocol } from '../bedrock-api';

export const getChainBreakdownAction = createAction({
  name: 'get-chain-breakdown',
  displayName: 'Get Chain Breakdown',
  description:
    'Get Bedrock TVL distributed across all supported chains, sorted by TVL descending with each chain's percentage of total.',
  props: {},
  async run() {
    const protocol = await fetchProtocol();
    const chainTvls = protocol.currentChainTvls;

    const total = Object.values(chainTvls).reduce((sum, v) => sum + v, 0);

    const chains = Object.entries(chainTvls)
      .filter(([, tvl]) => tvl > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([chain, tvl]) => ({
        chain,
        tvl,
        tvlFormatted: `$${(tvl / 1_000_000).toFixed(4)}M`,
        percentage: total > 0 ? parseFloat(((tvl / total) * 100).toFixed(2)) : 0,
        percentageFormatted: total > 0 ? `${((tvl / total) * 100).toFixed(2)}%` : '0%',
      }));

    return {
      totalTvl: total,
      totalTvlFormatted: `$${(total / 1_000_000).toFixed(2)}M`,
      chainCount: chains.length,
      chains,
    };
  },
});
