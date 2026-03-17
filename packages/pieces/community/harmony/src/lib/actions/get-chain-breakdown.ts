import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

interface ProtocolData {
  currentChainTvls?: Record<string, number>;
  chainTvls?: Record<string, unknown>;
  name?: string;
  tvl?: number;
}

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Fetch the TVL breakdown by chain for the Harmony (ONE) protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<ProtocolData>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/harmony',
    });

    const data = response.body;
    return {
      name: data.name,
      totalTvl: data.tvl,
      chainBreakdown: data.currentChainTvls ?? {},
      chainTvls: data.chainTvls ?? {},
    };
  },
});
