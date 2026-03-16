import { createAction } from '@activepieces/pieces-framework';
import { makeRequest, DEFILLAMA_BASE } from '../lib/instadapp-api';

export const getChainTvl = createAction({
  name: 'get_chain_tvl',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Get Instadapp TVL broken down by blockchain (Ethereum, Polygon, Arbitrum, etc.) from DeFiLlama.',
  props: {},
  async run() {
    const data = await makeRequest('/protocol/instadapp', DEFILLAMA_BASE);
    const chainTvls = data.chainTvls ?? {};
    const currentChainTvls = data.currentChainTvls ?? {};

    const breakdown = Object.entries(currentChainTvls).map(([chain, tvl]) => ({
      chain,
      tvl_usd: tvl,
      historical: (chainTvls[chain]?.tvl ?? []).slice(-1)[0] ?? null,
    }));

    breakdown.sort((a, b) => (Number(b.tvl_usd) || 0) - (Number(a.tvl_usd) || 0));

    return {
      total_tvl: data.tvl,
      chain_count: breakdown.length,
      chains: breakdown,
    };
  },
});
