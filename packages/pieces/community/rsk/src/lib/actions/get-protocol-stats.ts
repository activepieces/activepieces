import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Get key statistics for the Rootstock (RSK) protocol including TVL, supported chains, and category from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      id: string;
      name: string;
      address: string | null;
      symbol: string;
      url: string;
      description: string;
      chains: string[];
      category: string;
      tvl: number;
      currentChainTvls: Record<string, number>;
      tvl_list: Array<{ date: number; totalLiquidityUSD: number }>;
      raises: unknown[];
      twitter: string;
      governanceID: string[] | null;
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/rsk',
    });

    const data = response.body;
    const tvlHistory = (data as any).tvl ?? [];
    const recentTvl = tvlHistory.slice(-7).map((e: any) => ({
      date: new Date(e.date * 1000).toISOString().split('T')[0],
      tvlUsd: e.totalLiquidityUSD,
    }));

    const tvlValues = tvlHistory.map((e: any) => e.totalLiquidityUSD as number);
    const ath = tvlValues.length ? Math.max(...tvlValues) : 0;

    return {
      name: data.name,
      symbol: data.symbol,
      description: data.description,
      url: data.url,
      category: data.category,
      chains: data.chains,
      numberOfChains: data.chains.length,
      currentTvlUsd: data.tvl,
      allTimeHighTvlUsd: ath,
      currentChainTvls: data.currentChainTvls,
      recentTvl7Days: recentTvl,
      twitter: data.twitter ?? null,
    };
  },
});
