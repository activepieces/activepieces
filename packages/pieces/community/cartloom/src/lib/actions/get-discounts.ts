import { createAction } from '@activepieces/pieces-framework';
import { getAllDiscounts } from '../api';
import { cartloomAuth } from '../auth';

export const getAllDiscountsAction = createAction({
  name: 'get_all_discounts',
  auth: cartloomAuth,
  displayName: 'Get All Discounts',
  description: 'Get a list of discounts from Cartloom',
  audience: 'both',
  aiMetadata: { description: 'Retrieves the full list of discounts configured in the connected Cartloom store. Use to browse existing discounts or find a discount ID before fetching one specific discount. Takes no input and returns all discounts; read-only and idempotent.', idempotent: true },
  props: {},
  async run(context) {
    return await getAllDiscounts(context.auth.props);
  },
});
