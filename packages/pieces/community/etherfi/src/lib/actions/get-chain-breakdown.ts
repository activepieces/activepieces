import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { parseChainBreakdown } from '../etherfi-api';

export const getChainBreakdown = createAction({
  name: 'get-chain-breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Fetch TVL distribution across all chains where Ether.fi operates, sorted by TVL descending.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      currentChainTvls: Record<string, number>;
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/ether.fi',
    });

    const currentChainTvls = response.body.currentChainTvls ?? {};
    const breakdown = parseChainBreakdown(currentChainTvls);

    return {
      chains: breakdown,
      total_tvl: breakdown.reduce((sum, c) => sum + c.tvl, 0),
    };
  },
});
