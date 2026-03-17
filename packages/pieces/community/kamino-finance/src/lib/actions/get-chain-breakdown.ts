import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface DeFiLlamaProtocol {
  chainTvls: Record<string, { tvl: { totalLiquidityUSD: number }[] }>;
}

export const getChainBreakdown = createAction({
  name: 'get-chain-breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Fetch per-chain TVL breakdown for Kamino Finance, sorted by size',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<DeFiLlamaProtocol>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/kamino',
    });
    const data = response.body;
    const chainTvls = data.chainTvls ?? {};

    const breakdown = Object.entries(chainTvls)
      .map(([chain, chainData]) => {
        const tvlArr = chainData.tvl ?? [];
        const latestTvl = tvlArr[tvlArr.length - 1]?.totalLiquidityUSD ?? 0;
        return { chain, tvl: latestTvl };
      })
      .filter((entry) => !entry.chain.includes('-')) // exclude sub-category entries like "Solana-borrowed"
      .sort((a, b) => b.tvl - a.tvl);

    return { breakdown };
  },
});
