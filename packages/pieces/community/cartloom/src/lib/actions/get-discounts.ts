import { createAction } from '@activepieces/pieces-framework';
import { getAllDiscounts } from '../api';
import { cartloomAuth } from '../auth';

export const getAllDiscountsAction = createAction({
  name: 'get_all_discounts',
  auth: cartloomAuth,
  displayName: 'Get All Discounts',
  description: 'Get a list of discounts from Cartloom',
  props: {},
  async run(context) {
    return await getAllDiscounts(context.auth);
  },
});
