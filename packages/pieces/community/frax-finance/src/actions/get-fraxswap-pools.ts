import { createAction } from '@activepieces/pieces-framework';
import { getYieldPools } from '../lib/frax-api';

export const getFraxswapPools = createAction({
  name: 'get_fraxswap_pools',
  displayName: 'Get FraxSwap AMM Pools',
  description: 'Get FraxSwap AMM pool data and liquidity metrics from DeFiLlama Yields',
  props: {},
  async run() {
    const response = await getYieldPools();
    const pools = response.data ?? [];

    const fraxswapPools = pools.filter(
      (pool) => pool['project'] === 'fraxswap'
    );

    if (fraxswapPools.length === 0) {
      return {
        message: 'No FraxSwap pools found at this time.',
        pools: [],
        fetched_at: new Date().toISOString(),
      };
    }

    const formattedPools = fraxswapPools.map((pool) => ({
      pool_id: pool['pool'],
      symbol: pool['symbol'],
      chain: pool['chain'],
      apy: pool['apy'],
      apy_base: pool['apyBase'],
      apy_reward: pool['apyReward'],
      tvl_usd: pool['tvlUsd'],
      reward_tokens: pool['rewardTokens'],
      underlying_tokens: pool['underlyingTokens'],
      il_risk: pool['ilRisk'],
    }));

    // Group by chain
    const byChain: Record<string, typeof formattedPools> = {};
    for (const pool of formattedPools) {
      const chain = pool.chain as string ?? 'unknown';
      if (!byChain[chain]) byChain[chain] = [];
      byChain[chain].push(pool);
    }

    return {
      total_pools: fraxswapPools.length,
      total_tvl_usd: formattedPools.reduce((sum, p) => sum + (p.tvl_usd as number || 0), 0),
      pools_by_chain: byChain,
      pools: formattedPools,
      fetched_at: new Date().toISOString(),
    };
  },
});
