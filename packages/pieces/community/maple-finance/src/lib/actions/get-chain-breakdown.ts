import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface ChainTvlEntry {
  date: number;
  totalLiquidityUSD: number;
}

interface ChainData {
  tvl: ChainTvlEntry[];
}

interface DefiLlamaProtocol {
  name: string;
  chainTvls: Record<string, ChainData>;
}

export const getChainBreakdownAction = createAction({
  name: 'get-chain-breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Fetch TVL breakdown by blockchain chain for Maple Finance from DeFiLlama',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<DefiLlamaProtocol>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/maple-finance',
    });

    const chainTvls = response.body.chainTvls ?? {};

    const breakdown: Record<string, number> = {};
    for (const [chain, data] of Object.entries(chainTvls)) {
      const tvlArray = data.tvl;
      if (Array.isArray(tvlArray) && tvlArray.length > 0) {
        const latest = tvlArray[tvlArray.length - 1];
        breakdown[chain] = latest.totalLiquidityUSD;
      }
    }

    const sorted = Object.entries(breakdown)
      .sort(([, a], [, b]) => b - a)
      .map(([chain, tvl]) => ({ chain, tvl_usd: tvl }));

    return {
      protocol: response.body.name,
      chain_breakdown: sorted,
      total_chains: sorted.length,
    };
  },
});
