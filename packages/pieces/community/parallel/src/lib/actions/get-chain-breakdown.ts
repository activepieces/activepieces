import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface DefiLlamaProtocol {
  name: string;
  tvl: number;
  currentChainTvls: Record<string, number>;
  chains: string[];
}

interface ChainEntry {
  chain: string;
  tvl: number;
  tvlFormatted: string;
  percentage: string;
}

export const getChainBreakdown = createAction({
  name: 'get-chain-breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Fetch TVL breakdown by blockchain for Parallel Finance from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<DefiLlamaProtocol>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/parallel',
    });

    const data = response.body;
    const chainTvls = data.currentChainTvls ?? {};
    const totalTvl = data.tvl ?? 0;

    const breakdown: ChainEntry[] = Object.entries(chainTvls)
      .filter(([, tvl]) => typeof tvl === 'number' && tvl > 0)
      .map(([chain, tvl]) => ({
        chain,
        tvl: tvl as number,
        tvlFormatted: `$${((tvl as number) / 1_000_000).toFixed(2)}M`,
        percentage: totalTvl > 0 ? `${(((tvl as number) / totalTvl) * 100).toFixed(2)}%` : '0%',
      }))
      .sort((a, b) => b.tvl - a.tvl);

    return {
      protocol: data.name,
      totalTvl,
      totalTvlFormatted: `$${(totalTvl / 1_000_000).toFixed(2)}M`,
      chainCount: breakdown.length,
      chains: breakdown,
    };
  },
});
