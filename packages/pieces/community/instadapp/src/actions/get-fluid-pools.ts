import { createAction } from '@activepieces/pieces-framework';
import { makeRequest, DEFILLAMA_YIELDS_BASE } from '../lib/instadapp-api';

export const getFluidPools = createAction({
  name: 'get_fluid_pools',
  displayName: 'Get Fluid Pools',
  description: 'Get all Fluid lending pools with APY and yield data from DeFiLlama Yields.',
  props: {},
  async run() {
    const data = await makeRequest('/pools', DEFILLAMA_YIELDS_BASE);
    const fluidPools = (data.data ?? []).filter(
      (pool: Record<string, unknown>) => pool['project'] === 'fluid'
    );
    return {
      count: fluidPools.length,
      pools: fluidPools.map((pool: Record<string, unknown>) => ({
        pool: pool['pool'],
        chain: pool['chain'],
        project: pool['project'],
        symbol: pool['symbol'],
        tvlUsd: pool['tvlUsd'],
        apy: pool['apy'],
        apyBase: pool['apyBase'],
        apyReward: pool['apyReward'],
        rewardTokens: pool['rewardTokens'],
        underlyingTokens: pool['underlyingTokens'],
        stablecoin: pool['stablecoin'],
        ilRisk: pool['ilRisk'],
        exposure: pool['exposure'],
      })),
    };
  },
});
