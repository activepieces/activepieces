import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { createDraftOrder } from '../common';
import { ShopifyDraftOrder } from '../common/types';

export const createDraftOrderAction = createAction({
  auth: shopifyAuth,
  name: 'create_draft_order',
  displayName: 'Create Draft Order',
  description: 'Create a new draft order.',
  audience: 'both',
  aiMetadata: { description: 'Create a draft (unfinalized) Shopify order from a single line item and optional customer, for quotes or invoices that are not yet placed. Pick this over Create Order when the order should stay editable and unpaid until completed. Each call creates a new draft, so it is not idempotent.', idempotent: false },
  props: {
    productId: Property.Number({
      displayName: 'Product',
      description: 'The ID of the product to create the order with.',
      required: false,
    }),
    variantId: Property.Number({
      displayName: 'Product Variant',
      description: 'The ID of the variant to create the order with.',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    quantity: Property.Number({
      displayName: 'Quantity',
      required: false,
      defaultValue: 1,
    }),
    price: Property.ShortText({
      displayName: 'Price',
      required: false,
    }),
    customerId: Property.ShortText({
      displayName: 'Customer',
      description: 'The ID of the customer to use.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { productId, variantId, title, quantity, price, customerId } =
      propsValue;

    const draftOrder: Partial<ShopifyDraftOrder> = {
      line_items: [
        {
          product_id: productId,
          variant_id: variantId,
          title,
          quantity,
          price,
        },
      ],
    };
    if (customerId) draftOrder.customer = { id: +customerId };

    return await createDraftOrder(draftOrder, auth);
  },
});
