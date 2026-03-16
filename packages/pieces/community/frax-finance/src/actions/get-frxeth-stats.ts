import { createAction } from '@activepieces/pieces-framework';
import { getYieldPools } from '../lib/frax-api';

export const getFrxethStats = createAction({
  name: 'get_frxeth_stats',
  displayName: 'Get frxETH Liquid Staking Stats',
  description: 'Get frxETH liquid staking pool statistics from DeFiLlama Yields',
  props: {},
  async run() {
    const response = await getYieldPools();
    const pools = response.data ?? [];

    const frxEthPools = pools.filter(
      (pool) => pool['project'] === 'frax-ether'
    );

    if (frxEthPools.length === 0) {
      return {
        message: 'No frxETH pools found at this time.',
        pools: [],
        fetched_at: new Date().toISOString(),
      };
    }

    const formattedPools = frxEthPools.map((pool) => ({
      pool_id: pool['pool'],
      symbol: pool['symbol'],
      chain: pool['chain'],
      apy: pool['apy'],
      apy_base: pool['apyBase'],
      apy_reward: pool['apyReward'],
      tvl_usd: pool['tvlUsd'],
      reward_tokens: pool['rewardTokens'],
      stable_coin: pool['stablecoin'],
    }));

    return {
      total_pools: frxEthPools.length,
      total_tvl_usd: formattedPools.reduce((sum, p) => sum + (p.tvl_usd as number || 0), 0),
      pools: formattedPools,
      fetched_at: new Date().toISOString(),
    };
  },
});
