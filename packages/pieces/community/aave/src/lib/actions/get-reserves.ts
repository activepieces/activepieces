import { createAction } from '@activepieces/pieces-framework';
import { aaveAuth } from '../aave-auth';
import { getReserves } from '../aave-api';

export const getReservesAction = createAction({
  auth: aaveAuth,
  name: 'get_reserves',
  displayName: 'Get Reserves',
  description:
    'Fetch all Aave V3 reserve (market) data including available assets, supply APY, borrow APY, and total liquidity.',
  props: {},
  async run(context) {
    const apiKey = context.auth as string | undefined;
    const reserves = await getReserves(apiKey);

    // Annotate with human-readable APY values (ray = 1e27)
    const RAY = 1e27;
    const annotated = (
      reserves as Array<{
        liquidityRate: string;
        variableBorrowRate: string;
        stableBorrowRate: string;
        [key: string]: unknown;
      }>
    ).map((r) => ({
      ...r,
      supplyAPY: (Number(r.liquidityRate) / RAY) * 100,
      variableBorrowAPY: (Number(r.variableBorrowRate) / RAY) * 100,
      stableBorrowAPY: (Number(r.stableBorrowRate) / RAY) * 100,
    }));

    return {
      count: annotated.length,
      reserves: annotated,
    };
  },
});
