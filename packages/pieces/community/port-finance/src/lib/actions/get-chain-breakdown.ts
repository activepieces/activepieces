import { createAction } from '@activepieces/pieces-framework';
import { getDefiLlamaProtocol } from '../port-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Fetch the TVL breakdown by blockchain chain for Port Finance from DeFiLlama.',
  props: {},
  async run() {
    const data = await getDefiLlamaProtocol();
    const currentChainTvls: Record<string, number> = data.currentChainTvls ?? {};
    const chains = Object.entries(currentChainTvls).map(([chain, tvl]) => ({
      chain,
      tvl,
    }));
    chains.sort((a, b) => (b.tvl as number) - (a.tvl as number));
    return {
      protocol: data.name,
      total_tvl: data.tvl,
      chain_count: chains.length,
      chains,
    };
  },
});
