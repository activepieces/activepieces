import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { createDraftOrder } from '../common';
import { ShopifyDraftOrder } from '../common/types';

export const createDraftOrderAction = createAction({
  auth: shopifyAuth,
  name: 'create_draft_order',
  classification: 'WRITE',
  displayName: 'Create Draft Order',
  description: 'Create a draft order with one line item.',
  audience: 'both',
  aiMetadata: { description: 'Create a draft (unfinalized) Shopify order from a single line item and optional customer, for quotes or invoices that are not yet placed. Pick this over Create Order when the order should stay editable and unpaid until completed. Each call creates a new draft, so it is not idempotent.', idempotent: false },
  propertyGroups: [
    {
      key: 'line_item',
      display: 'section',
      label: 'Line item',
      icon: 'tag',
      props: ['line_item_info', 'variantId', 'productId', 'title', 'price', 'quantity'],
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
