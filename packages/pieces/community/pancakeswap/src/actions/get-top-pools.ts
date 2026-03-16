import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../lib/pancakeswap-api';

export const getTopPools = createAction({
  name: 'get_top_pools',
  displayName: 'Get Top Pools',
  description: 'Get the highest-TVL PancakeSwap v3 pools from DeFiLlama Yields',
  auth: undefined,
  props: {
    limit: Property.Number({
      displayName: 'Number of Pools',
      description: 'Maximum number of top pools to return (default: 10)',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const limit = context.propsValue.limit ?? 10;

    const data = await makeRequest('/pools', 'https://yields.llama.fi');

    const pools: Array<Record<string, unknown>> = data.data ?? data;

    const pancakePools = pools
      .filter((p: Record<string, unknown>) => p['project'] === 'pancakeswap-amm-v3')
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => 
        ((b['tvlUsd'] as number) ?? 0) - ((a['tvlUsd'] as number) ?? 0)
      )
      .slice(0, limit)
      .map((p: Record<string, unknown>) => ({
        pool: p['pool'],
        chain: p['chain'],
        symbol: p['symbol'],
        project: p['project'],
        tvlUsd: p['tvlUsd'],
        apy: p['apy'],
        apyBase: p['apyBase'],
        apyReward: p['apyReward'],
        rewardTokens: p['rewardTokens'],
        volumeUsd1d: p['volumeUsd1d'],
        volumeUsd7d: p['volumeUsd7d'],
      }));

    return {
      count: pancakePools.length,
      pools: pancakePools,
      timestamp: new Date().toISOString(),
    };
  },
});
