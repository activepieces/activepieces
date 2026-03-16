import { createAction } from '@activepieces/pieces-framework';
import { getOsmosisPools } from '../lib/osmosis-api';

export const getPoolsAction = createAction({
  name: 'get_pools',
  displayName: 'Get Liquidity Pools',
  description: 'Retrieve all Osmosis liquidity pools from DeFiLlama Yields, including pool ID, symbol, TVL, and APY data.',
  props: {},
  async run() {
    const pools = await getOsmosisPools();
    return {
      count: pools.length,
      pools: pools.map((p: any) => ({
        pool: p.pool,
        symbol: p.symbol,
        tvlUsd: p.tvlUsd,
        apy: p.apy,
        apyBase: p.apyBase,
        apyReward: p.apyReward,
        chain: p.chain,
        project: p.project,
        rewardTokens: p.rewardTokens,
      })),
    };
  },
});
