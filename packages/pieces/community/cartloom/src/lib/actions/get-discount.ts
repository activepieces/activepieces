import { Property, createAction } from '@activepieces/pieces-framework';
import { getDiscount } from '../api';
import { cartloomAuth } from '../auth';

export const getDiscountAction = createAction({
  name: 'get_discount',
  auth: cartloomAuth,
  displayName: 'Get Discount',
  description: 'Get discount info from Cartloom',
  props: {
    discountId: Property.ShortText({
      displayName: 'Discount ID',
      description: 'Enter the ID of the discount you want to retrieve',
      required: true,
    }),
  },
  async run(context) {
    return await getDiscount(context.auth, context.propsValue.discountId);
  },
});
