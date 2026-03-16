import { createAction, Property } from '@activepieces/pieces-framework';
import { COLLATERAL_TYPES } from '../common/makerdao-api';

export const getCollateralTypes = createAction({
  name: 'get_collateral_types',
  displayName: 'Get Collateral Types',
  description: 'List all MakerDAO vault collateral types with their liquidation ratios and stability fees.',
  props: {
    tokenFilter: Property.ShortText({
      displayName: 'Token Filter (optional)',
      description: 'Filter by token symbol, e.g. ETH, WBTC, USDC',
      required: false,
    }),
  },
  async run(context) {
    const filter = context.propsValue.tokenFilter?.toUpperCase();
    let collaterals = COLLATERAL_TYPES;
    if (filter) {
      collaterals = collaterals.filter((c) =>
        c.token.toUpperCase().includes(filter) || c.ilk.toUpperCase().includes(filter)
      );
    }
    return {
      count: collaterals.length,
      collaterals: collaterals.map((c) => ({
        ilk: c.ilk,
        name: c.name,
        token: c.token,
        liquidationRatio: `${c.liquidationRatio}%`,
        stabilityFee: `${c.stabilityFee}%`,
      })),
    };
  },
});
