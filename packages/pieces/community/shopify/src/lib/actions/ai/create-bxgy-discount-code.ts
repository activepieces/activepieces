import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlDiscountNode,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiCreateBxgyDiscountCode = createAction({
  auth: shopifyAuth,
  name: 'create_bxgy_discount_code',
  classification: 'WRITE',
  displayName: 'Create Buy X Get Y Discount Code',
  description: 'Create a "buy X, get Y" discount that customers apply with a code.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a Buy X Get Y discount code and returns it with its id (gid://shopify/DiscountCodeNode/…). What the customer must buy: buys_type QUANTITY (buys_value is a whole number of items) or AMOUNT (buys_value is a spend in the shop currency), from specific products or variants (buys_product_ids / buys_variant_ids) or collections (buys_collection_ids). What the customer gets: gets_quantity items from gets_product_ids / gets_variant_ids or gets_collection_ids, discounted by gets_percentage (100 means free, the default; 50 means half price). Products and collections cannot be mixed on one side, and each side needs at least one id because Buy X Get Y cannot apply to all items. uses_per_order_limit caps how many times the offer applies in one order. eligibility decides who can use it: ALL buyers, specific CUSTOMERS or customer SEGMENTS; left unset it follows the ids given, and is ALL only when no ids are given. Optional usage limit, once per customer, end date, tags and which other discount classes it combines with (all off by default). starts_at defaults to now, so the code is live immediately unless a later start is given. Each call creates another discount; a code that already exists is rejected by Shopify. Needs the write_discounts access scope.',
    idempotent: false,
  },
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Internal title shown in the admin, for example "Buy 2 shirts, get 1 cap free".',
      required: true,
    }),
    code: Property.ShortText({
      displayName: 'Code',
      description: 'The code customers enter at checkout, for example "B2G1CAP".',
      required: true,
    }),
    buys_type: Property.StaticDropdown({
      displayName: 'Customer Buys',
      description: 'What the customer must buy to unlock the offer: a number of items or a minimum spend.',
      required: true,
      options: {
        options: [
          { label: 'Minimum quantity of items', value: 'QUANTITY' },
          { label: 'Minimum purchase amount', value: 'AMOUNT' },
        ],
      },
    }),
    buys_value: Property.Number({
      displayName: 'Buys Value',
      description: 'For QUANTITY the whole number of qualifying items, for example 2. For AMOUNT the spend on qualifying items in the shop currency, for example 50.',
      required: true,
    }),
    buys_product_ids: shopifyProps.idList({
      displayName: 'Buys Product IDs',
      description: 'Products that count toward what the customer buys, numeric or "gid://shopify/Product/…". Use products and variants, or collections, not both.',
    }),
    buys_variant_ids: shopifyProps.idList({
      displayName: 'Buys Variant IDs',
      description: 'Variants that count toward what the customer buys, numeric or "gid://shopify/ProductVariant/…".',
    }),
    buys_collection_ids: shopifyProps.idList({
      displayName: 'Buys Collection IDs',
      description: 'Collections whose products count toward what the customer buys, numeric or "gid://shopify/Collection/…".',
    }),
    gets_quantity: Property.Number({
      displayName: 'Gets Quantity',
      description: 'How many discounted items the customer gets, a whole number of 1 or more, for example 1.',
      required: true,
    }),
    gets_percentage: Property.Number({
      displayName: 'Gets Percentage Off',
      description: 'Percent off the items the customer gets, above 0 and at most 100. 100 (the default) makes them free; 50 is half price.',
      required: false,
    }),
    gets_product_ids: shopifyProps.idList({
      displayName: 'Gets Product IDs',
      description: 'Products the customer gets at the discount, numeric or "gid://shopify/Product/…". Use products and variants, or collections, not both.',
    }),
    gets_variant_ids: shopifyProps.idList({
      displayName: 'Gets Variant IDs',
      description: 'Variants the customer gets at the discount, numeric or "gid://shopify/ProductVariant/…".',
    }),
    gets_collection_ids: shopifyProps.idList({
      displayName: 'Gets Collection IDs',
      description: 'Collections whose products the customer gets at the discount, numeric or "gid://shopify/Collection/…".',
    }),
    uses_per_order_limit: Property.Number({
      displayName: 'Uses Per Order Limit',
      description: 'Optional: the most times the offer applies in one order, a whole number of 1 or more. Leave empty for no limit.',
      required: false,
    }),
    eligibility: Property.StaticDropdown({
      displayName: 'Eligibility',
      description: 'Who can use the code. Leave unset to infer it from the ids: CUSTOMERS when customer_ids are given, SEGMENTS when segment_ids are given, ALL buyers when no ids are given.',
      required: false,
      options: {
        options: [
          { label: 'All buyers', value: 'ALL' },
          { label: 'Specific customers', value: 'CUSTOMERS' },
          { label: 'Customer segments', value: 'SEGMENTS' },
        ],
      },
    }),
    customer_ids: shopifyProps.idList({
      displayName: 'Customer IDs',
      description: 'With eligibility CUSTOMERS: customer ids, numeric or "gid://shopify/Customer/…".',
    }),
    segment_ids: shopifyProps.idList({
      displayName: 'Segment IDs',
      description: 'With eligibility SEGMENTS: customer segment ids, numeric or "gid://shopify/Segment/…".',
    }),
    starts_at: Property.DateTime({
      displayName: 'Starts At',
      description: 'When the code becomes usable, ISO 8601. Defaults to now.',
      required: false,
    }),
    ends_at: Property.DateTime({
      displayName: 'Ends At',
      description: 'Optional end, ISO 8601. Leave empty for no end date.',
      required: false,
    }),
    usage_limit: Property.Number({
      displayName: 'Usage Limit',
      description: 'Optional total number of times the code can be used across all customers.',
      required: false,
    }),
    applies_once_per_customer: Property.Checkbox({
      displayName: 'Once Per Customer',
      description: 'Each customer can use the code only once. Off by default.',
      required: false,
      defaultValue: false,
    }),
    combines_with_product_discounts: Property.Checkbox({
      displayName: 'Combines With Product Discounts',
      description: 'Can be combined with other product discounts. Off by default.',
      required: false,
      defaultValue: false,
    }),
    combines_with_order_discounts: Property.Checkbox({
      displayName: 'Combines With Order Discounts',
      description: 'Can be combined with order discounts. Off by default.',
      required: false,
      defaultValue: false,
    }),
    combines_with_shipping_discounts: Property.Checkbox({
      displayName: 'Combines With Shipping Discounts',
      description: 'Can be combined with shipping discounts. Off by default.',
      required: false,
      defaultValue: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Optional tags for the discount, for example "bogo".',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const title = shopifyValues.nonEmpty(propsValue.title);
    const code = shopifyValues.nonEmpty(propsValue.code);
    if (!title || !code) {
      throw new Error('Provide both title and code. Nothing was created.');
    }
    const buysItems = shopifyValues.buildDiscountItems({
      appliesTo: undefined,
      productIdsToAdd: propsValue.buys_product_ids,
      productIdsToRemove: undefined,
      variantIdsToAdd: propsValue.buys_variant_ids,
      variantIdsToRemove: undefined,
      collectionIdsToAdd: propsValue.buys_collection_ids,
      collectionIdsToRemove: undefined,
    });
    if (!buysItems) {
      throw new Error(
        'Say what the customer must buy: give buys_product_ids / buys_variant_ids or buys_collection_ids (Buy X Get Y cannot apply to all items). Nothing was created.'
      );
    }
    const getsItems = shopifyValues.buildDiscountItems({
      appliesTo: undefined,
      productIdsToAdd: propsValue.gets_product_ids,
      productIdsToRemove: undefined,
      variantIdsToAdd: propsValue.gets_variant_ids,
      variantIdsToRemove: undefined,
      collectionIdsToAdd: propsValue.gets_collection_ids,
      collectionIdsToRemove: undefined,
    });
    if (!getsItems) {
      throw new Error(
        'Say what the customer gets: give gets_product_ids / gets_variant_ids or gets_collection_ids (Buy X Get Y cannot apply to all items). Nothing was created.'
      );
    }
    const bxgyCodeDiscount = shopifyValues.compact({
      title,
      code,
      startsAt: shopifyValues.nonEmpty(propsValue.starts_at) ?? new Date().toISOString(),
      endsAt: shopifyValues.nonEmpty(propsValue.ends_at),
      customerBuys: {
        value: buildBuysValue({
          buysType: propsValue.buys_type,
          buysValue: shopifyValues.readNumber(propsValue.buys_value),
        }),
        items: buysItems,
      },
      customerGets: {
        value: {
          discountOnQuantity: {
            quantity: String(readWholeNumber({ value: propsValue.gets_quantity, name: 'gets_quantity' })),
            effect: { percentage: readPercentage(propsValue.gets_percentage) },
          },
        },
        items: getsItems,
      },
      usesPerOrderLimit: readOptionalWholeNumber({ value: propsValue.uses_per_order_limit, name: 'uses_per_order_limit' }),
      context:
        shopifyValues.buildDiscountContext({
          eligibility: propsValue.eligibility,
          customerIdsToAdd: propsValue.customer_ids,
          customerIdsToRemove: undefined,
          segmentIdsToAdd: propsValue.segment_ids,
          segmentIdsToRemove: undefined,
        }) ?? { all: 'ALL' },
      usageLimit: readOptionalWholeNumber({ value: propsValue.usage_limit, name: 'usage_limit' }),
      appliesOncePerCustomer: propsValue.applies_once_per_customer ?? false,
      combinesWith: shopifyValues.buildCombinesWith({
        productDiscounts: propsValue.combines_with_product_discounts ?? false,
        orderDiscounts: propsValue.combines_with_order_discounts ?? false,
        shippingDiscounts: propsValue.combines_with_shipping_discounts ?? false,
      }),
      tags: shopifyValues.nonEmptyList(propsValue.tags),
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      discountCodeBxgyCreate: { codeDiscountNode: GqlDiscountNode | null } | null;
    }>({
      auth,
      query: `mutation CreateBxgyDiscountCode($bxgyCodeDiscount: DiscountCodeBxgyInput!) { discountCodeBxgyCreate(bxgyCodeDiscount: $bxgyCodeDiscount) { codeDiscountNode { id discount: codeDiscount { ${shopifyFields.CODE_DISCOUNT_DETAIL_FIELDS} } } userErrors { field message code } } }`,
      variables: { bxgyCodeDiscount },
    });
    const node = data.discountCodeBxgyCreate?.codeDiscountNode;
    if (!node) {
      throw new Error('Shopify did not return the new discount.');
    }
    return {
      ...shopifyMappers.mapDiscountNode(node),
      redacted_fields: redactedFields,
    };
  },
});

function buildBuysValue({
  buysType,
  buysValue,
}: {
  buysType: string | undefined;
  buysValue: number | undefined;
}): Record<string, string> {
  if (buysValue === undefined) {
    throw new Error('Provide buys_value. Nothing was created.');
  }
  if (buysType === 'QUANTITY') {
    return { quantity: String(readWholeNumber({ value: buysValue, name: 'buys_value' })) };
  }
  if (buysType === 'AMOUNT') {
    if (!(buysValue > 0)) {
      throw new Error('With buys_type AMOUNT, buys_value must be above 0, for example 50. Nothing was created.');
    }
    return { amount: String(buysValue) };
  }
  throw new Error(`Unknown buys_type "${buysType}". Use QUANTITY or AMOUNT. Nothing was created.`);
}

function readPercentage(value: number | undefined | null): number {
  const percent = shopifyValues.readNumber(value) ?? 100;
  if (!(percent > 0 && percent <= 100)) {
    throw new Error('gets_percentage must be above 0 and at most 100 (100 means free). Nothing was created.');
  }
  return Math.round(percent * 100) / 10000;
}

function readWholeNumber({ value, name }: { value: number | undefined | null; name: string }): number {
  const number = shopifyValues.readNumber(value);
  if (number === undefined || !Number.isInteger(number) || number < 1) {
    throw new Error(`${name} must be a whole number of 1 or more. Nothing was created.`);
  }
  return number;
}

function readOptionalWholeNumber({
  value,
  name,
}: {
  value: number | undefined | null;
  name: string;
}): number | undefined {
  if (shopifyValues.readNumber(value) === undefined) {
    return undefined;
  }
  return readWholeNumber({ value, name });
}
