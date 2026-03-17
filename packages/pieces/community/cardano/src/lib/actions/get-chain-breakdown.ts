import { createAction } from '@activepieces/pieces-framework';
import { defiLlamaGet, CARDANO_SLUG } from '../common/cardano-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description:
    'Retrieve the TVL breakdown by chain for the Cardano protocol from DeFiLlama.',
  props: {},
  async run() {
    const data = await defiLlamaGet(`/protocol/${CARDANO_SLUG}`);
    const currentChainTvls: Record<string, number> = data.currentChainTvls ?? {};
    const breakdown = Object.entries(currentChainTvls).map(([chain, tvl]) => ({
      chain,
      tvl,
    }));
    breakdown.sort((a, b) => (b.tvl as number) - (a.tvl as number));
    return {
      protocol: data.name,
      total_tvl: data.tvl,
      chain_breakdown: breakdown,
    };
  },
});
