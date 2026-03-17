import { createAction } from '@activepieces/pieces-framework';
import { defiLlamaRequest } from '../sudoswap-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description:
    'Retrieve the TVL breakdown across all chains where Sudoswap is deployed, sourced from DeFiLlama.',
  props: {},
  async run() {
    const data = await defiLlamaRequest<any>('/protocol/sudoswap');

    const chainTvls = data.currentChainTvls ?? {};
    const breakdown = Object.entries(chainTvls).map(([chain, tvl]) => ({
      chain,
      tvlUSD: tvl,
    }));

    breakdown.sort((a: any, b: any) => (b.tvlUSD as number) - (a.tvlUSD as number));

    return {
      chains: breakdown,
      totalChains: breakdown.length,
      dominantChain: breakdown[0]?.chain ?? null,
      dominantChainTvl: breakdown[0]?.tvlUSD ?? null,
    };
  },
});
