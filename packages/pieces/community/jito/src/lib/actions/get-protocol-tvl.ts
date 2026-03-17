import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description:
    'Fetch the current Total Value Locked (TVL) for the Jito liquid staking protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/jito',
    });

    const data = response.body as any;
    const tvlArr: { date: number; totalLiquidityUSD: number }[] = data.tvl ?? [];
    const latest = tvlArr.length > 0 ? tvlArr[tvlArr.length - 1] : null;

    return {
      name: data.name,
      symbol: data.symbol,
      chain: data.chain,
      category: data.category,
      description: data.description,
      url: data.url,
      currentTvlUSD: latest?.totalLiquidityUSD ?? null,
      currentChainTvls: data.currentChainTvls ?? {},
      lastUpdated: latest ? new Date(latest.date * 1000).toISOString() : null,
    };
  },
});
