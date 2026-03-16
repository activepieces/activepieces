import { createAction } from '@activepieces/pieces-framework';
import { defiLlamaYieldsRequest } from '../rocket-pool-api';

export const getStakingApy = createAction({
  name: 'get_staking_apy',
  displayName: 'Get rETH Staking APY',
  description: 'Get current rETH staking APY and yield pool data from DeFiLlama Yields',
  props: {},
  async run() {
    const data = await defiLlamaYieldsRequest('/pools');
    const pools = data.data ?? [];
    const rocketPools = pools.filter(
      p => p.project === 'rocket-pool' || (p.symbol && p.symbol.toLowerCase().includes('reth'))
    );
    rocketPools.sort((a, b) => (b.tvlUsd ?? 0) - (a.tvlUsd ?? 0));
    const topPools = rocketPools.slice(0, 10).map(p => ({
      pool: p.pool,
      symbol: p.symbol,
      project: p.project,
      chain: p.chain,
      apyBase: p.apyBase,
      apyReward: p.apyReward,
      apy: p.apy,
      tvlUSD: p.tvlUsd,
      rewardTokens: p.rewardTokens,
      underlyingTokens: p.underlyingTokens,
    }));
    const bestApy = topPools.length > 0 ? topPools[0].apy : null;
    return {
      protocol: 'Rocket Pool',
      bestApyPct: bestApy,
      poolsFound: rocketPools.length,
      topPools,
    };
  },
});
