import { createAction } from '@activepieces/pieces-framework';
import { getSolidlyProtocol } from '../common/solidly-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Get Solidly TVL breakdown by blockchain, sorted by TVL descending.',
  auth: undefined,
  props: {},
  async run() {
    const data = await getSolidlyProtocol();
    const chainTvls: Record<string, any> = data.chainTvls ?? {};

    const chains = Object.entries(chainTvls)
      .map(([chain, info]: [string, any]) => ({
        chain,
        tvl: typeof info === 'object' ? (info.tvl ?? 0) : info,
      }))
      .sort((a, b) => b.tvl - a.tvl);

    return {
      chains,
      total_chains: chains.length,
    };
  },
});
