import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface ChainTvlEntry {
  tvl: { date: number; totalLiquidityUSD: number }[];
}

interface ProtocolResponse {
  chainTvls: Record<string, ChainTvlEntry>;
  chains: string[];
}

export const getChainBreakdown = createAction({
  name: 'get-chain-breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Fetch per-chain TVL breakdown for Goldfinch Finance from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<ProtocolResponse>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/goldfinch',
    });

    const { chainTvls, chains } = response.body;

    const breakdown: Record<string, number> = {};
    for (const chain of Object.keys(chainTvls)) {
      const entries = chainTvls[chain].tvl ?? [];
      if (entries.length > 0) {
        breakdown[chain] = entries[entries.length - 1].totalLiquidityUSD;
      } else {
        breakdown[chain] = 0;
      }
    }

    return {
      chains,
      breakdown,
    };
  },
});
