import { createAction } from '@activepieces/pieces-framework';
import { siloRequest } from '../lib/silo-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description:
    'Get Silo Finance TVL breakdown by chain (e.g. Ethereum, Arbitrum) from DeFiLlama.',
  props: {},
  async run() {
    const data = await siloRequest('/protocol/silo-finance');

    const chainTvls = data.chainTvls ?? {};
    const chains = Object.entries(chainTvls).map(([chain, info]: [string, any]) => ({
      chain,
      tvl: typeof info === 'object' ? (info.tvl ?? info) : info,
    }));

    chains.sort((a, b) => (b.tvl as number) - (a.tvl as number));

    return {
      totalTvl: data.tvl,
      chains,
    };
  },
});
