import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface ChainTvlEntry {
  totalLiquidityUSD: number;
  date: number;
}

interface DeFiLlamaProtocol {
  name: string;
  chains: string[];
  chainTvls: Record<string, { tvl: ChainTvlEntry[] }>;
}

interface ChainBreakdown {
  chain: string;
  tvl: number;
  tvlFormatted: string;
  percentage: number;
}

export const getChainBreakdown = createAction({
  name: 'get-chain-breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Fetch per-chain TVL breakdown for Spark Protocol, sorted by size',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<DeFiLlamaProtocol>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/spark',
    });

    const data = response.body;
    const chainTvls = data.chainTvls ?? {};

    const breakdown: ChainBreakdown[] = Object.entries(chainTvls)
      .filter(([, chainData]) => chainData.tvl && chainData.tvl.length > 0)
      .map(([chain, chainData]) => {
        const latestTvl = chainData.tvl[chainData.tvl.length - 1]?.totalLiquidityUSD ?? 0;
        return {
          chain,
          tvl: latestTvl,
          tvlFormatted: latestTvl >= 1e9
            ? `$${(latestTvl / 1e9).toFixed(2)}B`
            : `$${(latestTvl / 1e6).toFixed(2)}M`,
          percentage: 0,
        };
      })
      .sort((a, b) => b.tvl - a.tvl);

    const totalTvl = breakdown.reduce((sum, c) => sum + c.tvl, 0);
    breakdown.forEach(c => {
      c.percentage = totalTvl > 0 ? parseFloat(((c.tvl / totalTvl) * 100).toFixed(2)) : 0;
    });

    return {
      chains: breakdown,
      totalTvl,
      totalTvlFormatted: `$${(totalTvl / 1e9).toFixed(2)}B`,
      chainCount: breakdown.length,
      timestamp: new Date().toISOString(),
    };
  },
});
