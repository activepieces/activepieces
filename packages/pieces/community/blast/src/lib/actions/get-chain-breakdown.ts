import { createAction } from '@activepieces/pieces-framework';
import { defiLlamaRequest } from '../blast-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get TVL by Chain Breakdown',
  description:
    'Retrieve the TVL breakdown by chain for the Blast protocol from DeFiLlama, showing how liquidity is distributed across networks.',
  props: {},
  async run() {
    const data = await defiLlamaRequest<Record<string, unknown>>('/protocol/blast');
    const currentChainTvls = (data as any).currentChainTvls ?? {};
    const chains = Object.entries(currentChainTvls).map(([chain, tvl]) => ({
      chain,
      tvlUsd: tvl,
    }));
    chains.sort((a, b) => Number(b.tvlUsd) - Number(a.tvlUsd));
    return {
      totalTvlUsd: chains.reduce((acc, c) => acc + Number(c.tvlUsd), 0),
      chainCount: chains.length,
      breakdown: chains,
    };
  },
});
