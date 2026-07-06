import { Property, createAction } from '@activepieces/pieces-framework';
import { getDiscount } from '../api';
import { cartloomAuth } from '../auth';

export const getDiscountAction = createAction({
  name: 'get_discount',
  auth: cartloomAuth,
  displayName: 'Get Discount',
  description: 'Get discount info from Cartloom',
  audience: 'both',
  aiMetadata: { description: 'Retrieves the details of a single Cartloom discount by its discount ID. Use when you have a specific discount ID; to list discounts without an ID, use Get All Discounts. Read-only and idempotent.', idempotent: true },
  props: {
    discountId: Property.ShortText({
      displayName: 'Discount ID',
      description: 'Enter the ID of the discount you want to retrieve',
      required: true,
    }),
  },
  async run(context) {
    return await getDiscount(context.auth.props, context.propsValue.discountId);
  },
});
