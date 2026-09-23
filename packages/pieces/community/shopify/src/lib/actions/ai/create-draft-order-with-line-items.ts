import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlDraftOrder,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiCreateDraftOrderWithLineItems = createAction({
  auth: shopifyAuth,
  name: 'create_draft_order_with_line_items',
  classification: 'WRITE',
  displayName: 'Create Draft Order',
  description: 'Create a draft order with one or more product or custom line items.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a draft order (a quote the merchant or customer can review) with one or more product-variant or custom line items, an optional customer, order-level discount and shipping line. Nothing is charged and no stock is committed; send it with send_draft_order_invoice or turn it into an order with complete_draft_order. Each call creates a new draft, so retries duplicate.',
    idempotent: false,
  },
  props: {
    line_items: shopifyProps.draftLineItems({
      required: true,
      description:
        'The items on the draft. Give either a variant id (price comes from the product) or a title and price for a custom item.',
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description:
        'Three-letter currency code for the unit prices and shipping price given here, for example "USD". Required when any price is given. Find the shop currency with get_shop.',
      required: false,
    }),
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Customer the draft is for, numeric or "gid://shopify/Customer/…". Find it with search_customers.',
      required: false,
    }),
    use_customer_default_address: Property.Checkbox({
      displayName: 'Use Customer Default Address',
      description: "Use the customer's default address as the shipping address. Needs a customer.",
      required: false,
      defaultValue: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email the invoice is sent to, for example "jane@example.com".',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Contact phone in E.164 format, for example "+16135551111".',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'Internal note on the draft.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to set on the draft, for example ["quote", "b2b"].',
      required: false,
    }),
    po_number: Property.ShortText({
      displayName: 'PO Number',
      description: 'Purchase order number, for example "PO-2026-114".',
      required: false,
    }),
    discount_value: Property.Number({
      displayName: 'Order Discount Value',
      description: 'Discount on the whole draft: a percentage (10 for 10%) or a fixed amount, per the discount type.',
      required: false,
    }),
    discount_value_type: Property.StaticDropdown({
      displayName: 'Order Discount Type',
      description: 'How the order discount value applies. Required with a discount value.',
      required: false,
      options: {
        options: [
          { label: 'Percentage', value: 'PERCENTAGE' },
          { label: 'Fixed amount', value: 'FIXED_AMOUNT' },
        ],
      },
    }),
    discount_title: Property.ShortText({
      displayName: 'Order Discount Title',
      description: 'Label shown for the discount, for example "Loyalty discount".',
      required: false,
    }),
    shipping_title: Property.ShortText({
      displayName: 'Shipping Line Title',
      description: 'Name of a custom shipping line, for example "Courier".',
      required: false,
    }),
    shipping_price: Property.Number({
      displayName: 'Shipping Price',
      description: 'Price of the custom shipping line, for example 12.00. Requires a shipping title and a currency.',
      required: false,
    }),
    reserve_inventory_until: Property.DateTime({
      displayName: 'Reserve Inventory Until',
      description: 'Hold the stock for this draft until this time (ISO 8601). Leave empty to not reserve stock.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const currency = shopifyValues.nonEmpty(propsValue.currency)?.toUpperCase();
    const lineItems = shopifyValues.buildDraftLineItems({ value: propsValue.line_items, currency });
    if (lineItems.length === 0) {
      throw new Error('Add at least one line item.');
    }
    const customerId = shopifyValues.nonEmpty(propsValue.customer_id);
    const input = shopifyValues.compact({
      lineItems,
      purchasingEntity: customerId
        ? { customerId: shopifyGraphqlClient.toGid({ type: 'Customer', id: customerId }) }
        : undefined,
      useCustomerDefaultAddress: customerId && propsValue.use_customer_default_address ? true : undefined,
      email: shopifyValues.nonEmpty(propsValue.email),
      phone: shopifyValues.nonEmpty(propsValue.phone),
      note: shopifyValues.nonEmpty(propsValue.note),
      tags: shopifyValues.readStringList(propsValue.tags),
      poNumber: shopifyValues.nonEmpty(propsValue.po_number),
      appliedDiscount: buildAppliedDiscount({
        value: propsValue.discount_value,
        valueType: propsValue.discount_value_type,
        title: shopifyValues.nonEmpty(propsValue.discount_title),
      }),
      shippingLine: buildShippingLine({
        title: shopifyValues.nonEmpty(propsValue.shipping_title),
        price: propsValue.shipping_price,
        currency,
      }),
      reserveInventoryUntil: shopifyValues.nonEmpty(propsValue.reserve_inventory_until),
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      draftOrderCreate: { draftOrder: GqlDraftOrder | null } | null;
    }>({
      auth,
      query: `mutation CreateDraftOrder($input: DraftOrderInput!) { draftOrderCreate(input: $input) { draftOrder { ${shopifyFields.DRAFT_ORDER_DETAIL_FIELDS} } userErrors { field message } } }`,
      variables: { input },
    });
    const draft = data.draftOrderCreate?.draftOrder;
    if (!draft) {
      throw new Error('Shopify did not return the created draft order.');
    }
    return {
      ...shopifyMappers.mapDraftOrderDetail(draft),
      redacted_fields: redactedFields,
    };
  },
});

function buildAppliedDiscount({
  value,
  valueType,
  title,
}: {
  value: number | undefined | null;
  valueType: string | undefined;
  title: string | undefined;
}): Record<string, unknown> | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (!valueType) {
    throw new Error('Set "discount_value_type" when giving a discount value.');
  }
  return shopifyValues.compact({ value, valueType, title });
}

function buildShippingLine({
  title,
  price,
  currency,
}: {
  title: string | undefined;
  price: number | undefined | null;
  currency: string | undefined;
}): Record<string, unknown> | undefined {
  if (!title) {
    if (price !== undefined && price !== null) {
      throw new Error('Set "shipping_title" when giving a shipping price.');
    }
    return undefined;
  }
  if (price === undefined || price === null) {
    return { title };
  }
  if (!currency) {
    throw new Error('Set "currency" (for example "USD") when giving a shipping price.');
  }
  return { title, priceWithCurrency: { amount: String(price), currencyCode: currency } };
}
