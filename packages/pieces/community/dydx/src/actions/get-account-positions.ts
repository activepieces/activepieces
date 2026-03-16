import { createAction, Property } from '@activepieces/pieces-framework';
import { dydxRequest } from '../lib/dydx-api';

export const getAccountPositions = createAction({
  name: 'get_account_positions',
  displayName: 'Get Account Positions',
  description: 'Get open perpetual positions for a dYdX address',
  auth: undefined,
  props: {
    address: Property.ShortText({
      displayName: 'dYdX Address',
      description: 'The dYdX chain address (e.g. dydx1abc...)',
      required: true,
    }),
  },
  async run(context) {
    const { address } = context.propsValue;
    return await dydxRequest(`/v4/addresses/${address}/subaccounts/0`);
  },
});
