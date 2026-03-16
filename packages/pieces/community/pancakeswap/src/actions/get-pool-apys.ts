import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../lib/pancakeswap-api';

export const getPoolApys = createAction({
  name: 'get_pool_apys',
  displayName: 'Get Pool APYs',
  description: 'Get PancakeSwap pool APY data with optional minimum APY filter from DeFiLlama Yields',
  auth: undefined,
  props: {
    minApy: Property.Number({
      displayName: 'Minimum APY (%)',
      description: 'Only return pools with APY above this percentage (e.g. 5 for 5%). Leave empty for all pools.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of pools to return (default: 20)',
      required: false,
      defaultValue: 20,
    }),
    chain: Property.ShortText({
      displayName: 'Chain Filter',
      description: 'Filter pools by chain name (e.g. "BSC", "Ethereum"). Leave empty for all chains.',
      required: false,
    }),
  },
  async run(context) {
    const { minApy, limit = 20, chain } = context.propsValue;

    const data = await makeRequest('/pools', 'https://yields.llama.fi');
    const pools: Array<Record<string, unknown>> = data.data ?? data;

    let filtered = pools.filter(
      (p: Record<string, unknown>) => p['project'] === 'pancakeswap-amm-v3'
    );

    if (minApy !== undefined && minApy !== null) {
      filtered = filtered.filter(
        (p: Record<string, unknown>) => ((p['apy'] as number) ?? 0) >= minApy
      );
    }

    if (chain) {
      const chainLower = chain.toLowerCase();
      filtered = filtered.filter(
        (p: Record<string, unknown>) =>
          typeof p['chain'] === 'string' && p['chain'].toLowerCase() === chainLower
      );
    }

    filtered = filtered
      .sort(
        (a: Record<string, unknown>, b: Record<string, unknown>) =>
          ((b['apy'] as number) ?? 0) - ((a['apy'] as number) ?? 0)
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
        apyMean30d: p['apyMean30d'],
        rewardTokens: p['rewardTokens'],
        ilRisk: p['ilRisk'],
        exposure: p['exposure'],
      }));

    return {
      filters: {
        minApy: minApy ?? null,
        chain: chain ?? null,
        limit,
      },
      count: filtered.length,
      pools: filtered,
      timestamp: new Date().toISOString(),
    };
  },
});
