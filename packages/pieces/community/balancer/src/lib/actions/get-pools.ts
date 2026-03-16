import { createAction, Property } from '@activepieces/pieces-framework';
import { balancerQuery, BalancerPool } from '../balancer-api';

const GET_POOLS_QUERY = `
  query GetTopPools($first: Int!, $orderBy: Pool_orderBy!, $orderDirection: OrderDirection!) {
    pools(
      first: $first
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: { totalLiquidity_gt: "0" }
    ) {
      id
      name
      symbol
      poolType
      swapFee
      totalLiquidity
      totalSwapVolume
      tokens {
        address
        symbol
        name
        balance
        weight
      }
    }
  }
`;

export const getPoolsAction = createAction({
  name: 'get_pools',
  displayName: 'Get Top Liquidity Pools',
  description:
    'Retrieve the top liquidity pools on Balancer sorted by TVL or swap volume.',
  props: {
    limit: Property.Number({
      displayName: 'Number of Pools',
      description: 'How many pools to return (max 100).',
      required: false,
      defaultValue: 10,
    }),
    orderBy: Property.StaticDropdown({
      displayName: 'Order By',
      description: 'Sort pools by this field.',
      required: false,
      defaultValue: 'totalLiquidity',
      options: {
        options: [
          { label: 'Total Liquidity (TVL)', value: 'totalLiquidity' },
          { label: 'Total Swap Volume', value: 'totalSwapVolume' },
          { label: 'Total Swap Fee', value: 'totalSwapFee' },
        ],
      },
    }),
  },
  async run(context) {
    const limit = Math.min(context.propsValue.limit ?? 10, 100);
    const orderBy = context.propsValue.orderBy ?? 'totalLiquidity';

    const data = await balancerQuery<{ pools: BalancerPool[] }>(
      GET_POOLS_QUERY,
      { first: limit, orderBy, orderDirection: 'desc' }
    );

    return data.pools.map((pool) => ({
      id: pool.id,
      name: pool.name || pool.symbol,
      symbol: pool.symbol,
      poolType: pool.poolType,
      swapFee: pool.swapFee,
      totalLiquidityUSD: parseFloat(pool.totalLiquidity).toLocaleString(
        'en-US',
        { style: 'currency', currency: 'USD' }
      ),
      totalLiquidity: pool.totalLiquidity,
      totalSwapVolume: pool.totalSwapVolume,
      tokens: pool.tokens?.map((t) => ({
        symbol: t.symbol,
        address: t.address,
        balance: t.balance,
        weight: t.weight
          ? (parseFloat(t.weight) * 100).toFixed(0) + '%'
          : 'dynamic',
      })),
    }));
  },
});
