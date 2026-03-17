import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

type ChainTvl = {
  [chain: string]: number;
};

type DefiLlamaProtocol = {
  chainTvls: ChainTvl;
  chains: string[];
};

export const getChainBreakdown = createAction({
  name: 'get-chain-breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Fetch per-chain TVL sorted by size from DeFiLlama',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<DefiLlamaProtocol>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/renzo',
    });
    const data = response.body;
    const chainTvls = data.chainTvls ?? {};

    // Build per-chain breakdown with current TVL values
    const breakdown = Object.entries(chainTvls)
      .map(([chain, tvlData]) => {
        // chainTvls values may be objects with a tvl array or a number
        let currentTvl = 0;
        if (typeof tvlData === 'number') {
          currentTvl = tvlData;
        } else if (Array.isArray((tvlData as any).tvl)) {
          const arr = (tvlData as any).tvl as { totalLiquidityUSD: number }[];
          currentTvl = arr[arr.length - 1]?.totalLiquidityUSD ?? 0;
        }
        return { chain, tvl: currentTvl };
      })
      .filter((c) => c.tvl > 0)
      .sort((a, b) => b.tvl - a.tvl);

    const totalTvl = breakdown.reduce((sum, c) => sum + c.tvl, 0);

    return {
      chains: breakdown.map((c) => ({
        chain: c.chain,
        tvl: c.tvl,
        tvlFormatted: `$${(c.tvl / 1e6).toFixed(2)}M`,
        share: totalTvl > 0 ? `${((c.tvl / totalTvl) * 100).toFixed(1)}%` : '0%',
      })),
      totalTvl,
      chainCount: breakdown.length,
    };
  },
});
