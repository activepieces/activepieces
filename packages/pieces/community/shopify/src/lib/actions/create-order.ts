import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { createOrder } from '../common';
import { ShopifyOrder } from '../common/types';

export const createOrderAction = createAction({
  auth: shopifyAuth,
  name: 'create_order',
  classification: 'WRITE',
  displayName: 'Create Order',
  description: 'Create an order with one line item.',
  audience: 'both',
  aiMetadata: { description: 'Create a new placed Shopify order from a single line item, with optional customer, email, and receipt toggles. Pick this for a finalized order; use Create Draft Order when it should remain an editable, unpaid draft. Each call creates a new order, so repeating it may produce duplicates.', idempotent: false },
  propertyGroups: [
    {
      key: 'line_item',
      display: 'section',
      label: 'Line item',
      icon: 'tag',
      props: ['line_item_info', 'variantId', 'productId', 'title', 'price', 'quantity'],
    },
    {
      key: 'customer',
      display: 'section',
      label: 'Customer and receipts',
      icon: 'user',
      props: ['customerId', 'email', 'receipts_info', 'sendReceipt', 'sendFulfillmentReceipt'],
    },
  ],
  props: {
    line_item_info: Property.MarkDown({
      value: 'Use a Variant ID, or a Title and Price for a custom item.',
    }),
    variantId: Property.Number({
      displayName: 'Variant ID',
      description: "The number after /variants/ in the variant's admin URL.",
      required: false,
      width: 'half',
    }),
    productId: Property.Number({
      displayName: 'Product ID',
      required: false,
      width: 'half',
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Name of a custom item.',
      placeholder: 'Gift wrapping',
      required: false,
      width: 'half',
    }),
    price: Property.ShortText({
      displayName: 'Price',
      description: 'Price of a custom item.',
      placeholder: '9.99',
      required: false,
      width: 'half',
    }),
    quantity: Property.Number({
      displayName: 'Quantity',
      required: false,
      defaultValue: 1,
    }),
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      description: "The number at the end of the customer's URL in Shopify admin.",
      placeholder: '1234567890',
      required: false,
      width: 'half',
    }),
    email: Property.ShortText({
      displayName: 'Email',
      placeholder: 'jane@example.com',
      required: false,
      width: 'half',
    }),
    receipts_info: Property.MarkDown({
      value: 'Receipts are only sent when Email is filled in.',
    }),
    sendReceipt: Property.Checkbox({
      displayName: 'Send Receipt',
      description: 'Email the order confirmation to the customer.',
      required: false,
      defaultValue: false,
    }),
    sendFulfillmentReceipt: Property.Checkbox({
      displayName: 'Send Fulfillment Receipt',
      description: 'Email a shipping confirmation to the customer.',
      required: false,
      defaultValue: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'Separate tags with commas.',
      placeholder: 'sale, summer',
      required: false,
      advanced: true,
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
