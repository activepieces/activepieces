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

export const shopifyAiCreateBasicDiscountCode = createAction({
  auth: shopifyAuth,
  name: 'create_basic_discount_code',
  classification: 'WRITE',
  displayName: 'Create Amount-Off Discount Code',
  description: 'Create a percentage or fixed-amount discount that customers apply with a code.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates an amount-off discount code (percentage or fixed amount) and returns it with its id (gid://shopify/DiscountCodeNode/…). value_type PERCENTAGE takes the percent as a number (15 means 15% off); FIXED_AMOUNT takes an amount in the shop currency. applies_to decides what it discounts: ALL items, specific PRODUCTS (product or variant ids) or COLLECTIONS; left unset it follows the ids given, and is ALL only when no ids are given. eligibility decides who can use it: ALL buyers, specific CUSTOMERS or customer SEGMENTS; left unset it follows the ids given, and is ALL only when no ids are given. Optional minimum subtotal or quantity, usage limit, once per customer, end date, tags and which other discount classes it combines with (all off by default). starts_at defaults to now, so the code is live immediately unless a later start is given. Each call creates another discount; a code that already exists is rejected by Shopify. Needs the write_discounts access scope.',
    idempotent: false,
  },
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Internal title shown in the admin, for example "Spring sale 15%".',
      required: true,
    }),
    code: Property.ShortText({
      displayName: 'Code',
      description: 'The code customers enter at checkout, for example "SPRING15".',
      required: true,
    }),
    value_type: Property.StaticDropdown({
      displayName: 'Value Type',
      description: 'Percentage off or a fixed amount off.',
      required: true,
      options: {
        options: [
          { label: 'Percentage', value: 'PERCENTAGE' },
          { label: 'Fixed amount', value: 'FIXED_AMOUNT' },
        ],
      },
    }),
    value: Property.Number({
      displayName: 'Value',
      description: 'For PERCENTAGE the percent, 15 means 15% off (above 0, at most 100). For FIXED_AMOUNT the amount in the shop currency, for example 10.',
      required: true,
    }),
    applies_on_each_item: shopifyProps.booleanChoice({
      displayName: 'Apply Amount To Each Item',
      description: 'FIXED_AMOUNT only: Yes takes the amount off every eligible item, No takes it off once per order. Leave unset for Shopify\'s default.',
    }),
    applies_to: Property.StaticDropdown({
      displayName: 'Applies To',
      description: 'What the discount applies to. Leave unset to infer it from the ids: PRODUCTS when product_ids or variant_ids are given, COLLECTIONS when collection_ids are given, ALL items when no ids are given.',
      required: false,
      options: {
        options: [
          { label: 'All items', value: 'ALL' },
          { label: 'Specific products or variants', value: 'PRODUCTS' },
          { label: 'Specific collections', value: 'COLLECTIONS' },
        ],
      },
    }),
    product_ids: shopifyProps.idList({
      displayName: 'Product IDs',
      description: 'With applies_to PRODUCTS: product ids, numeric or "gid://shopify/Product/…".',
    }),
    variant_ids: shopifyProps.idList({
      displayName: 'Variant IDs',
      description: 'With applies_to PRODUCTS: variant ids, numeric or "gid://shopify/ProductVariant/…".',
    }),
    collection_ids: shopifyProps.idList({
      displayName: 'Collection IDs',
      description: 'With applies_to COLLECTIONS: collection ids, numeric or "gid://shopify/Collection/…".',
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
    minimum_requirement: Property.StaticDropdown({
      displayName: 'Minimum Requirement',
      description: 'Optional minimum the cart must reach. Leave unset for none.',
      required: false,
      options: {
        options: [
          { label: 'Minimum subtotal', value: 'SUBTOTAL' },
          { label: 'Minimum quantity of items', value: 'QUANTITY' },
        ],
      },
    }),
    minimum_value: Property.Number({
      displayName: 'Minimum Value',
      description: 'With a minimum requirement: the subtotal (for example 50) or the whole-number item quantity (for example 3).',
      required: false,
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
      description: 'Optional tags for the discount, for example "spring".',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const title = shopifyValues.nonEmpty(propsValue.title);
    const code = shopifyValues.nonEmpty(propsValue.code);
    if (!title || !code) {
      throw new Error('Provide both title and code. Nothing was created.');
    }
    const basicCodeDiscount = shopifyValues.compact({
      title,
      code,
      startsAt: shopifyValues.nonEmpty(propsValue.starts_at) ?? new Date().toISOString(),
      endsAt: shopifyValues.nonEmpty(propsValue.ends_at),
      customerGets: {
        value: shopifyValues.buildDiscountValue({
          valueType: propsValue.value_type,
          value: propsValue.value,
          appliesOnEachItem: shopifyValues.toBooleanChoice(propsValue.applies_on_each_item),
        }),
        items: shopifyValues.buildDiscountItems({
          appliesTo: propsValue.applies_to,
          productIdsToAdd: propsValue.product_ids,
          productIdsToRemove: undefined,
          variantIdsToAdd: propsValue.variant_ids,
          variantIdsToRemove: undefined,
          collectionIdsToAdd: propsValue.collection_ids,
          collectionIdsToRemove: undefined,
        }) ?? { all: true },
      },
      context: shopifyValues.buildDiscountContext({
        eligibility: propsValue.eligibility,
        customerIdsToAdd: propsValue.customer_ids,
        customerIdsToRemove: undefined,
        segmentIdsToAdd: propsValue.segment_ids,
        segmentIdsToRemove: undefined,
      }) ?? { all: 'ALL' },
      minimumRequirement: shopifyValues.buildMinimumRequirement({
        kind: propsValue.minimum_requirement,
        value: shopifyValues.readNumber(propsValue.minimum_value),
      }),
      usageLimit: readUsageLimit(propsValue.usage_limit),
      appliesOncePerCustomer: propsValue.applies_once_per_customer ?? false,
      combinesWith: shopifyValues.buildCombinesWith({
        productDiscounts: propsValue.combines_with_product_discounts ?? false,
        orderDiscounts: propsValue.combines_with_order_discounts ?? false,
        shippingDiscounts: propsValue.combines_with_shipping_discounts ?? false,
      }),
      tags: shopifyValues.nonEmptyList(propsValue.tags),
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      discountCodeBasicCreate: { codeDiscountNode: GqlDiscountNode | null } | null;
    }>({
      auth,
      query: `mutation CreateBasicDiscountCode($basicCodeDiscount: DiscountCodeBasicInput!) { discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) { codeDiscountNode { id discount: codeDiscount { ${shopifyFields.CODE_DISCOUNT_DETAIL_FIELDS} } } userErrors { field message code } } }`,
      variables: { basicCodeDiscount },
    });
    const node = data.discountCodeBasicCreate?.codeDiscountNode;
    if (!node) {
      throw new Error('Shopify did not return the new discount.');
    }
    return {
      ...shopifyMappers.mapDiscountNode(node),
      redacted_fields: redactedFields,
    };
  },
});

function readUsageLimit(value: number | undefined | null): number | undefined {
  const limit = shopifyValues.readNumber(value);
  if (limit === undefined) {
    return undefined;
  }
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error('usage_limit must be a whole number of 1 or more. Nothing was changed.');
  }
  return limit;
}
