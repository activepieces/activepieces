import { createAction, Property } from '@activepieces/pieces-framework';
import { balancerQuery, BalancerPool } from '../balancer-api';

const GET_POOL_DETAILS_QUERY = `
  query GetPoolDetails($id: ID!) {
    pool(id: $id) {
      id
      name
      symbol
      poolType
      swapFee
      totalLiquidity
      totalSwapVolume
      totalSwapFee
      tokens {
        address
        symbol
        name
        decimals
        balance
        weight
      }
    }
  }
`;

export const getPoolDetailsAction = createAction({
  name: 'get_pool_details',
  displayName: 'Get Pool Details',
  description:
    'Get detailed information about a specific Balancer pool by its ID.',
  props: {
    poolId: Property.ShortText({
      displayName: 'Pool ID',
      description:
        'The pool contract address (lowercase). Example: 0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014',
      required: true,
    }),
  },
  async run(context) {
    const poolId = context.propsValue.poolId.toLowerCase().trim();

    const data = await balancerQuery<{ pool: BalancerPool | null }>(
      GET_POOL_DETAILS_QUERY,
      { id: poolId }
    );

    if (!data.pool) {
      throw new Error('Pool not found: ' + poolId);
    }

    const pool = data.pool;
    return {
      id: pool.id,
      name: pool.name || pool.symbol,
      symbol: pool.symbol,
      poolType: pool.poolType,
      swapFeePercent: (parseFloat(pool.swapFee) * 100).toFixed(4) + '%',
      swapFee: pool.swapFee,
      totalLiquidityUSD: parseFloat(pool.totalLiquidity).toLocaleString(
        'en-US',
        { style: 'currency', currency: 'USD' }
      ),
      totalLiquidity: pool.totalLiquidity,
      totalSwapVolume: pool.totalSwapVolume,
      totalSwapFee: pool.totalSwapFee,
      tokens: pool.tokens?.map((t) => ({
        symbol: t.symbol,
        name: t.name,
        address: t.address,
        decimals: t.decimals,
        balance: t.balance,
        weight: t.weight
          ? (parseFloat(t.weight) * 100).toFixed(2) + '%'
          : 'dynamic',
      })),
    };
  },
});
