import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

type DefiLlamaProtocol = {
  chainTvls: Record<string, { tvl: { totalLiquidityUSD: number }[] }>;
};

export const getChainBreakdown = createAction({
  name: 'get-chain-breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Fetch per-chain TVL distribution for Puffer Finance, sorted by size.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<DefiLlamaProtocol>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/puffer-finance',
    });

    const chainTvls = response.body.chainTvls ?? {};

    const breakdown = Object.entries(chainTvls)
      .map(([chain, chainData]) => {
        const tvlArray = chainData.tvl ?? [];
        const latestTvl = tvlArray[tvlArray.length - 1]?.totalLiquidityUSD ?? 0;
        return { chain, tvl: latestTvl };
      })
      .filter((entry) => entry.tvl > 0)
      .sort((a, b) => b.tvl - a.tvl);

    return { chains: breakdown };
  },
});
