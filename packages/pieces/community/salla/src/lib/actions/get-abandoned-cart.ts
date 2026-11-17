import { createAction } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaMarketing } from '../common/marketing';
import { sallaOutputSchemas } from '../common/output-schemas';
import { sallaProps } from '../common/props';

export const getAbandonedCartAction = createAction({
  auth: sallaAuth,
  name: 'get_abandoned_cart',
  classification: 'READ',
  displayName: 'Get Abandoned Cart',
  description: 'Gets one abandoned cart by ID, with its customer, items, total and checkout link. The Salla app needs the Abandoned Carts scope.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches one Salla abandoned cart by numeric cart ID (for example 1097962121), with the customer, items, total and the checkout link to send back to the customer. Use Find Abandoned Carts or List Abandoned Carts to look carts up by customer or age first. Read-only and safe to retry; needs the Abandoned Carts scope.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.abandonedCart,
  props: {
    cart: sallaProps.abandonedCart({ required: true }),
  },
  async run({ auth, propsValue }) {
    return sallaMarketing.getAbandonedCart({
      auth,
      cartId: propsValue.cart,
    });
  },
});
