import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface ChainTvlEntry {
  tvl: number;
}

interface ProtocolResponse {
  chainTvls: Record<string, ChainTvlEntry>;
  chains: string[];
}

export const getChainBreakdown = createAction({
  name: 'get-chain-breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Fetches the TVL breakdown across all chains where Ondo Finance is deployed.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<ProtocolResponse>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/ondo-finance',
    });

    const data = response.body;
    const chainTvls = data.chainTvls;

    const breakdown: Record<string, number> = {};
    for (const chain of Object.keys(chainTvls)) {
      const entry = chainTvls[chain];
      if (typeof entry === 'object' && entry !== null && 'tvl' in entry) {
        breakdown[chain] = (entry as ChainTvlEntry).tvl;
      } else if (typeof entry === 'number') {
        breakdown[chain] = entry as unknown as number;
      }
    }

    const sorted = Object.entries(breakdown)
      .sort(([, a], [, b]) => b - a)
      .map(([chain, tvl]) => ({ chain, tvl }));

    return {
      chains: data.chains,
      breakdown: sorted,
    };
  },
});
