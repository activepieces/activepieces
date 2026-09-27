import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlOrder,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiCreateOrderWithLineItems = createAction({
  auth: shopifyAuth,
  name: 'create_order_with_line_items',
  classification: 'WRITE',
  displayName: 'Create Order',
  description: 'Create a real order with one or more line items.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a committed order (not a draft) with one or more product-variant or custom line items, an optional customer, shipping address, shipping line and at most one discount code. Use create_draft_order_with_line_items instead when the customer should review or pay through an invoice. Each call creates a new order, so retries duplicate; development stores allow 5 orders per minute. No receipt is emailed unless send_receipt is on.',
    idempotent: false,
  },
  props: {
    line_items: Property.Array({
      displayName: 'Line Items',
      description:
        'The items to order. Give either a variant id (price comes from the product) or a title and price for a custom item.',
      required: true,
      properties: {
        variant_id: Property.ShortText({
          displayName: 'Variant ID',
          description: 'Product variant id, for example "39072856" or "gid://shopify/ProductVariant/39072856".',
          required: false,
        }),
        title: Property.ShortText({
          displayName: 'Title',
          description: 'Title of a custom item (no variant), for example "Gift wrapping".',
          required: false,
        }),
        quantity: Property.Number({
          displayName: 'Quantity',
          description: 'How many units, at least 1.',
          required: true,
        }),
        price: Property.Number({
          displayName: 'Unit Price',
          description: 'Unit price in the order currency, for example 19.99. Required for custom items.',
          required: false,
        }),
        sku: Property.ShortText({
          displayName: 'SKU',
          description: 'Optional SKU for a custom item.',
          required: false,
        }),
      },
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description:
        'Three-letter currency code for every price given here, for example "USD". Required when any unit price, shipping price or fixed discount is given. Find the shop currency with get_shop.',
      required: false,
    }),
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Existing customer to attach, numeric or "gid://shopify/Customer/…". Find it with search_customers.',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Order contact email, for example "jane@example.com".',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Order contact phone in E.164 format, for example "+16135551111".',
      required: false,
    }),
    financial_status: Property.StaticDropdown({
      displayName: 'Financial Status',
      description: 'Payment status to record on the order. Leave empty to let Shopify decide.',
      required: false,
      options: {
        options: [
          { label: 'Pending', value: 'PENDING' },
          { label: 'Authorized', value: 'AUTHORIZED' },
          { label: 'Paid', value: 'PAID' },
          { label: 'Partially paid', value: 'PARTIALLY_PAID' },
        ],
      },
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'Internal note on the order.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to set on the order, for example ["wholesale", "phone-order"].',
      required: false,
    }),
    discount_code: Property.ShortText({
      displayName: 'Discount Code',
      description: 'One discount code to record on the order, for example "SUMMER10". Only one code is allowed.',
      required: false,
    }),
    discount_type: Property.StaticDropdown({
      displayName: 'Discount Type',
      description: 'How the discount code applies. Required with a discount code.',
      required: false,
      options: {
        options: [
          { label: 'Percentage off items', value: 'PERCENTAGE' },
          { label: 'Fixed amount off items', value: 'FIXED_AMOUNT' },
          { label: 'Free shipping', value: 'FREE_SHIPPING' },
        ],
      },
    }),
    discount_value: Property.Number({
      displayName: 'Discount Value',
      description: 'Percentage (for example 10 for 10%) or fixed amount, depending on the discount type.',
      required: false,
    }),
    shipping_title: Property.ShortText({
      displayName: 'Shipping Line Title',
      description: 'Name of the shipping method, for example "Standard Shipping". Needs a shipping price.',
      required: false,
    }),
    shipping_price: Property.Number({
      displayName: 'Shipping Price',
      description:
        'Shipping price in the order currency, for example 5.00 (use 0 for free shipping). Required together with the shipping line title, and needs a currency.',
      required: false,
    }),
    shipping_first_name: Property.ShortText({
      displayName: 'Shipping First Name',
      description: 'First name on the shipping address.',
      required: false,
    }),
    shipping_last_name: Property.ShortText({
      displayName: 'Shipping Last Name',
      description: 'Last name on the shipping address.',
      required: false,
    }),
    shipping_address1: Property.ShortText({
      displayName: 'Shipping Address Line 1',
      description: 'Street address, for example "150 Elgin Street".',
      required: false,
    }),
    shipping_address2: Property.ShortText({
      displayName: 'Shipping Address Line 2',
      description: 'Apartment, suite or unit.',
      required: false,
    }),
    shipping_city: Property.ShortText({
      displayName: 'Shipping City',
      description: 'City, for example "Ottawa".',
      required: false,
    }),
    shipping_province_code: Property.ShortText({
      displayName: 'Shipping Province / State Code',
      description: 'Region code, for example "ON".',
      required: false,
    }),
    shipping_country_code: Property.ShortText({
      displayName: 'Shipping Country Code',
      description: 'Two-letter ISO country code, for example "CA".',
      required: false,
    }),
    shipping_zip: Property.ShortText({
      displayName: 'Shipping Postal Code',
      description: 'Postal or ZIP code.',
      required: false,
    }),
    shipping_phone: Property.ShortText({
      displayName: 'Shipping Phone',
      description: 'Phone on the shipping address.',
      required: false,
    }),
    inventory_behaviour: Property.StaticDropdown({
      displayName: 'Inventory Behaviour',
      description: 'Whether to decrement stock. Leave empty for the Shopify default (bypass, stock is not changed).',
      required: false,
      options: {
        options: [
          { label: 'Bypass (do not change stock)', value: 'BYPASS' },
          { label: 'Decrement, obey inventory policy', value: 'DECREMENT_OBEYING_POLICY' },
          { label: 'Decrement, ignore inventory policy', value: 'DECREMENT_IGNORING_POLICY' },
        ],
      },
    }),
    send_receipt: Property.Checkbox({
      displayName: 'Send Order Receipt',
      description: 'Email the order confirmation to the customer. Off by default.',
      required: false,
      defaultValue: false,
    }),
    send_fulfillment_receipt: Property.Checkbox({
      displayName: 'Send Fulfillment Receipt',
      description: 'Email a shipping confirmation when the order is fulfilled. Off by default.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const currency = shopifyValues.nonEmpty(propsValue.currency)?.toUpperCase();
    const lineItems = shopifyValues.readRecords(propsValue.line_items).map((item) => {
      const variantId = shopifyValues.readText(item['variant_id']);
      const title = shopifyValues.readText(item['title']);
      const quantity = shopifyValues.readNumber(item['quantity']);
      const price = shopifyValues.readNumber(item['price']);
      if (quantity === undefined || quantity < 1) {
        throw new Error('Every line item needs a quantity of at least 1.');
      }
      if (!variantId && (!title || price === undefined)) {
        throw new Error('Every line item needs a variant_id, or a title and a price for a custom item.');
      }
      return shopifyValues.compact({
        variantId: variantId
          ? shopifyGraphqlClient.toGid({ type: 'ProductVariant', id: variantId })
          : undefined,
        title,
        quantity,
        sku: shopifyValues.readText(item['sku']),
        priceSet: price === undefined ? undefined : toMoneyBag({ amount: price, currency }),
      });
    });
    if (lineItems.length === 0) {
      throw new Error('Add at least one line item.');
    }
    const discountCode = shopifyValues.nonEmpty(propsValue.discount_code);
    const discount = buildDiscount({
      code: discountCode,
      type: propsValue.discount_type,
      value: propsValue.discount_value,
      currency,
    });
    const shippingTitle = shopifyValues.nonEmpty(propsValue.shipping_title);
    const shippingPrice = propsValue.shipping_price ?? undefined;
    if (shippingPrice !== undefined && !shippingTitle) {
      throw new Error('Set "shipping_title" when giving a shipping price.');
    }
    if (shippingTitle && shippingPrice === undefined) {
      throw new Error(
        'Set "shipping_price" (and "currency") when giving a shipping title. Shopify requires a price on every order shipping line; use 0 for free shipping.'
      );
    }
    const shippingAddress = shopifyValues.buildMailingAddress({
      first_name: propsValue.shipping_first_name,
      last_name: propsValue.shipping_last_name,
      address1: propsValue.shipping_address1,
      address2: propsValue.shipping_address2,
      city: propsValue.shipping_city,
      province_code: propsValue.shipping_province_code,
      country_code: propsValue.shipping_country_code,
      zip: propsValue.shipping_zip,
      phone: propsValue.shipping_phone,
    });
    const customerId = shopifyValues.nonEmpty(propsValue.customer_id);
    const order = shopifyValues.compact({
      lineItems,
      currency,
      email: shopifyValues.nonEmpty(propsValue.email),
      phone: shopifyValues.nonEmpty(propsValue.phone),
      financialStatus: propsValue.financial_status,
      note: shopifyValues.nonEmpty(propsValue.note),
      tags: shopifyValues.readStringList(propsValue.tags),
      customer: customerId
        ? { toAssociate: { id: shopifyGraphqlClient.toGid({ type: 'Customer', id: customerId }) } }
        : undefined,
      discountCode: discount,
      shippingLines:
        shippingTitle && shippingPrice !== undefined
          ? [{ title: shippingTitle, priceSet: toMoneyBag({ amount: shippingPrice, currency }) }]
          : undefined,
      shippingAddress: Object.keys(shippingAddress).length > 0 ? shippingAddress : undefined,
    });
    const options = shopifyValues.compact({
      sendReceipt: propsValue.send_receipt ?? false,
      sendFulfillmentReceipt: propsValue.send_fulfillment_receipt ?? false,
      inventoryBehaviour: propsValue.inventory_behaviour,
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      orderCreate: { order: GqlOrder | null } | null;
    }>({
      auth,
      query: `mutation CreateOrder($order: OrderCreateOrderInput!, $options: OrderCreateOptionsInput) { orderCreate(order: $order, options: $options) { order { ${shopifyFields.ORDER_DETAIL_FIELDS} } userErrors { field message code } } }`,
      primaryPaths: ['orderCreate.order'],
      variables: { order, options },
    });
    const created = data.orderCreate?.order;
    if (!created) {
      throw new Error('Shopify did not return the created order.');
    }
    return {
      ...shopifyMappers.mapOrderDetail(created),
      redacted_fields: redactedFields,
    };
  },
});

function buildDiscount({
  code,
  type,
  value,
  currency,
}: {
  code: string | undefined;
  type: string | undefined;
  value: number | undefined | null;
  currency: string | undefined;
}): Record<string, unknown> | undefined {
  if (!code) {
    return undefined;
  }
  if (type === 'FREE_SHIPPING') {
    return { freeShippingDiscountCode: { code } };
  }
  if (value === undefined || value === null) {
    throw new Error('Set "discount_value" for a percentage or fixed-amount discount code.');
  }
  if (type === 'PERCENTAGE') {
    return { itemPercentageDiscountCode: { code, percentage: value } };
  }
  if (type === 'FIXED_AMOUNT') {
    return { itemFixedDiscountCode: { code, amountSet: toMoneyBag({ amount: value, currency }) } };
  }
  throw new Error('Set "discount_type" when giving a discount code.');
}

function toMoneyBag({
  amount,
  currency,
}: {
  amount: number;
  currency: string | undefined;
}): { shopMoney: { amount: string; currencyCode: string } } {
  if (!currency) {
    throw new Error('Set "currency" (for example "USD") when giving a price or a fixed discount amount.');
  }
  return { shopMoney: { amount: String(amount), currencyCode: currency } };
}
