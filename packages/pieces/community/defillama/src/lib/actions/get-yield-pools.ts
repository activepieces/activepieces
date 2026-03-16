import { createAction, Property } from '@activepieces/pieces-framework';
import { defillamaRequest, yieldsUrl } from '../common/defillama-api';

interface YieldPool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apyBase: number | null;
  apyReward: number | null;
  apy: number;
  pool: string;
  stablecoin: boolean;
  ilRisk: string;
  exposure: string;
}

interface YieldsResponse {
  status: string;
  data: YieldPool[];
}

export const getYieldPools = createAction({
  name: 'get_yield_pools',
  displayName: 'Get Yield Pools',
  description:
    'Get top yield farming opportunities with APY and TVL data. Note: Downloads the full yield pools dataset (~4,000+ entries) and filters in memory. Best suited for broad queries.',
  props: {
    min_apy: Property.Number({
      displayName: 'Minimum APY',
      description: 'Only return pools with APY above this percentage (optional).',
      required: false,
    }),
    chain: Property.ShortText({
      displayName: 'Chain',
      description:
        'Filter by blockchain chain name (e.g. "Ethereum", "Arbitrum"). Leave empty for all chains.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of pools to return.',
      required: false,
      defaultValue: 20,
    }),
  },
  async run({ propsValue }) {
    const data = await defillamaRequest<YieldsResponse>(
      yieldsUrl('/pools')
    );

    let pools = data.data;

    if (propsValue.chain) {
      const chainFilter = propsValue.chain.toLowerCase().trim();
      pools = pools.filter(
        (p) => p.chain.toLowerCase() === chainFilter
      );
    }

    if (propsValue.min_apy != null) {
      pools = pools.filter((p) => (p.apy ?? 0) >= propsValue.min_apy!);
    }

    pools.sort((a, b) => (b.apy ?? 0) - (a.apy ?? 0));

    const limit = propsValue.limit ?? 20;
    const results = pools.slice(0, limit);

    return {
      count: results.length,
      pools: results.map((p) => ({
        pool: p.pool,
        project: p.project,
        chain: p.chain,
        symbol: p.symbol,
        apy: p.apy,
        apy_base: p.apyBase,
        apy_reward: p.apyReward,
        tvl_usd: p.tvlUsd,
        stablecoin: p.stablecoin,
        il_risk: p.ilRisk,
        exposure: p.exposure,
      })),
    };
  },
});
