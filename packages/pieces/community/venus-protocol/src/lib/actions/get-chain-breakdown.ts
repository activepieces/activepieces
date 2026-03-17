import { createAction } from '@activepieces/pieces-framework';
import { getProtocolData } from '../venus-protocol-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Fetch the TVL breakdown across all chains (BNB Chain and others) for Venus Protocol from DeFiLlama.',
  props: {},
  async run() {
    const protocol = await getProtocolData();

    const chains = Object.entries(protocol.chainTvls).map(([chain, tvl]) => ({
      chain,
      tvl,
    }));

    chains.sort((a, b) => b.tvl - a.tvl);

    return {
      name: protocol.name,
      total_tvl: protocol.tvl,
      chains,
    };
  },
});
