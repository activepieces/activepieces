import { createAction } from '@activepieces/pieces-framework';
import { fetchVertexProtocol } from '../vertex-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Fetch the TVL breakdown by chain for Vertex Protocol, sorted by TVL descending.',
  props: {},
  async run() {
    const data = await fetchVertexProtocol();
    const chainTvls: Record<string, any> = data.chainTvls ?? {};

    const breakdown = Object.entries(chainTvls)
      .map(([chain, info]: [string, any]) => ({
        chain,
        tvl: typeof info === 'object' ? (info.tvl ?? 0) : info,
      }))
      .sort((a, b) => b.tvl - a.tvl);

    return { chains: breakdown };
  },
});
