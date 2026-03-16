import { createAction, Property } from '@activepieces/pieces-framework';
import { balancerQuery, BalancerPool } from '../balancer-api';

const GET_TOKEN_POOLS_QUERY = `
  query GetTokenPools($tokenAddress: String!, $first: Int!) {
    pools(
      first: $first
      orderBy: totalLiquidity
      orderDirection: desc
      where: {
        tokensList_contains: [$tokenAddress]
        totalLiquidity_gt: "0"
      }
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
        balance
        weight
      }
    }
  }
`;

export const getTokenPoolsAction = createAction({
  name: 'get_token_pools',
  displayName: 'Get Pools by Token',
  description:
    'Find all Balancer liquidity pools containing a specific token address.',
  props: {
    tokenAddress: Property.ShortText({
      displayName: 'Token Address',
      description:
        'ERC-20 token contract address (lowercase). Example: 0xba100000625a3754423978a60c9317c58a424e3d (BAL token)',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Number of Pools',
      description: 'Maximum number of pools to return.',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const tokenAddress = context.propsValue.tokenAddress.toLowerCase().trim();
    const limit = Math.min(context.propsValue.limit ?? 10, 100);

    const data = await balancerQuery<{ pools: BalancerPool[] }>(
      GET_TOKEN_POOLS_QUERY,
      { tokenAddress, first: limit }
    );

    if (!data.pools || data.pools.length === 0) {
      return {
        pools: [],
        message: 'No pools found containing token ' + tokenAddress,
      };
    }

    return {
      tokenAddress,
      poolCount: data.pools.length,
      pools: data.pools.map((pool) => ({
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
            ? (parseFloat(t.weight) * 100).toFixed(2) + '%'
            : 'dynamic',
        })),
      })),
    };
  },
});
