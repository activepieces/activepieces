import { createAction } from '@activepieces/pieces-framework';
import { fetchDefiLlama } from '../klaytn-api';

export const getChainBreakdownAction = createAction({
  auth: undefined,
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description:
    'Fetch the TVL breakdown by chain for the Klaytn protocol from DeFiLlama.',
  props: {},
  async run() {
    const data = await fetchDefiLlama<{
      currentChainTvls: Record<string, number>;
      chainTvls: Record<string, { tvl: { date: number; totalLiquidityUSD: number }[] }>;
    }>('/protocol/klaytn');
    const currentChainTvls = data.currentChainTvls ?? {};
    const chains = Object.entries(currentChainTvls).map(([chain, tvl]) => ({
      chain,
      tvl_usd: tvl,
    }));
    return {
      chains,
      total_chains: chains.length,
    };
  },
});
