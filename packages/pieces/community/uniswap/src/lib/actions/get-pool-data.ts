import { createAction, Property } from '@activepieces/pieces-framework';
import { getPoolData } from '../uniswap-api';

export const getPoolDataAction = createAction({
  name: 'get_pool_data',
  displayName: 'Get Pool Data',
  description:
    'Query Uniswap v3 pool statistics — liquidity, volume, fees, and price data for a specific pool.',
  props: {
    poolId: Property.ShortText({
      displayName: 'Pool Address',
      description:
        'The Uniswap v3 pool contract address (e.g. 0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640 for USDC/ETH 0.05%)',
      required: true,
      defaultValue: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
    }),
  },
  async run(context) {
    const { poolId } = context.propsValue;
    const result = await getPoolData(poolId) as {
      data?: {
        pool?: {
          id: string;
          token0: { symbol: string };
          token1: { symbol: string };
          feeTier: string;
          volumeUSD: string;
          totalValueLockedUSD: string;
          txCount: string;
        };
      };
    };

    if (!result?.data?.pool) {
      return {
        error: `Pool not found: ${poolId}`,
        hint: 'Make sure the address is correct and is a Uniswap v3 pool on Ethereum mainnet.',
        raw: result,
      };
    }

    const pool = result.data.pool;
    return {
      pool: {
        ...pool,
        feeTierPercent: `${Number(pool.feeTier) / 10000}%`,
        volumeUSD_formatted: `$${parseFloat(pool.volumeUSD).toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
        tvlUSD_formatted: `$${parseFloat(pool.totalValueLockedUSD).toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
        pair: `${pool.token0.symbol}/${pool.token1.symbol}`,
      },
    };
  },
});
