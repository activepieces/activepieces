import { createAction } from '@activepieces/pieces-framework';
import { fetchBarnBridgeProtocol } from '../barnbridge-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Get the TVL breakdown by blockchain for BarnBridge protocol, sorted by TVL descending.',
  props: {},
  async run() {
    const data = await fetchBarnBridgeProtocol();
    const chainTvls: Record<string, any> = data.chainTvls ?? {};

    const breakdown = Object.entries(chainTvls)
      .map(([chain, info]: [string, any]) => ({
        chain,
        tvl: typeof info === 'object' && info !== null ? (info.tvl ?? 0) : (info ?? 0),
      }))
      .sort((a, b) => b.tvl - a.tvl);

    return { chains: breakdown };
  },
});
