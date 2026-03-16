import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description:
    'Fetch the current Total Value Locked (TVL) for the Meteora protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      tvl: number;
      name: string;
      symbol: string;
      chain: string;
      category: string;
      currentChainTvls: Record<string, number>;
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/meteora',
    });

    const data = response.body;
    const tvlArr: { date: number; totalLiquidityUSD: number }[] = (data as any).tvl ?? [];
    const latest = tvlArr.length > 0 ? tvlArr[tvlArr.length - 1] : null;

    return {
      name: data.name,
      symbol: data.symbol,
      chain: data.chain,
      category: data.category,
      currentTvlUSD: latest?.totalLiquidityUSD ?? null,
      currentChainTvls: data.currentChainTvls,
      lastUpdated: latest ? new Date(latest.date * 1000).toISOString() : null,
    };
  },
});
