import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { createOrder } from '../common';
import { ShopifyOrder } from '../common/types';

export const createOrderAction = createAction({
  auth: shopifyAuth,
  name: 'create_order',
  displayName: 'Create Order',
  description: 'Create a new order.',
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
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    sendReceipt: Property.Checkbox({
      displayName: 'Send Receipt',
      required: false,
      defaultValue: false,
    }),
    sendFulfillmentReceipt: Property.Checkbox({
      displayName: 'Send Fulfillment Receipt',
      required: false,
      defaultValue: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'A string of comma-separated tags for filtering and search',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      productId,
      variantId,
      title,
      quantity,
      price,
      customerId,
      email,
      sendReceipt,
      sendFulfillmentReceipt,
      tags,
    } = propsValue;

    const order: Partial<ShopifyOrder> = {
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
    if (customerId) order.customer = { id: +customerId };
    if (email) {
      order.email = email;
      order.send_receipt = sendReceipt;
      order.send_fulfillment_receipt = sendFulfillmentReceipt;
    }
    if (tags) order.tags = tags;

    return await createOrder(order, auth);
  },
});
