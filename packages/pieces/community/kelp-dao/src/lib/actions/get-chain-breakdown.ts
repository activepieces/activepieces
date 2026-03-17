import { createAction } from '@activepieces/pieces-framework';
import { fetchKelpProtocol, parseChainBreakdown } from '../kelpdao-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description:
    'Fetches the TVL breakdown by chain for Kelp DAO, sorted by TVL descending with percentage of total.',
  props: {},
  async run() {
    const protocol = await fetchKelpProtocol();
    const breakdown = parseChainBreakdown(protocol);

    return {
      chains: breakdown,
      total_tvl: protocol.tvl,
    };
  },
});
