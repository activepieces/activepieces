import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface ChainTvlEntry {
  tvl: number;
}

interface ProtocolResponse {
  chainTvls: Record<string, ChainTvlEntry>;
  currentChainTvls: Record<string, number>;
  chains: string[];
}

export const getChainBreakdown = createAction({
  name: 'get-chain-breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description:
    "Retrieve Centrifuge's TVL distribution broken down by each supported blockchain.",
  props: {},
  async run() {
    const response = await httpClient.sendRequest<ProtocolResponse>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/centrifuge',
    });

    const { chains, currentChainTvls } = response.body;

    const breakdown = chains.map((chain) => ({
      chain,
      tvlUsd: currentChainTvls[chain] ?? 0,
    }));

    breakdown.sort((a, b) => b.tvlUsd - a.tvlUsd);

    return {
      chains: breakdown,
      totalChains: chains.length,
    };
  },
});
