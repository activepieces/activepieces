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
import { discountOutputSchema } from '../../output-schemas/fulfillment';

export const shopifyAiCreateFreeShippingDiscountCode = createAction({
  auth: shopifyAuth,
  name: 'create_free_shipping_discount_code',
  classification: 'WRITE',
  displayName: 'Create Free Shipping Discount Code',
  description: 'Create a free shipping discount that customers apply with a code.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a free shipping discount code and returns it with its id (gid://shopify/DiscountCodeNode/…). Choose where it applies (all countries, or a list of ISO country codes; left unset it follows country_codes, and is all countries only when none are given), optionally cap the shipping rate it covers (maximum_shipping_price), and who can use it: ALL buyers, specific CUSTOMERS or customer SEGMENTS (left unset it follows the ids given, and is ALL only when no ids are given). Optional minimum subtotal or quantity, usage limit, once per customer, end date, tags and which other discount classes it combines with (all off by default). starts_at defaults to now, so the code is live immediately unless a later start is given. Each call creates another discount; a code that already exists is rejected by Shopify. Needs the write_discounts access scope.',
    idempotent: false,
  },
  outputSchema: discountOutputSchema,
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Internal title shown in the admin, for example "Free shipping over 50".',
      required: true,
    }),
    code: Property.ShortText({
      displayName: 'Code',
      description: 'The code customers enter at checkout, for example "FREESHIP".',
      required: true,
    }),
    destination: Property.StaticDropdown({
      displayName: 'Destination',
      description: 'Where free shipping applies. Leave unset to infer it: COUNTRIES when country_codes are given, ALL countries when none are given.',
      required: false,
      options: {
        options: [
          { label: 'All countries', value: 'ALL' },
          { label: 'Specific countries', value: 'COUNTRIES' },
        ],
      },
    }),
    country_codes: Property.Array({
      displayName: 'Country Codes',
      description: 'With destination COUNTRIES: two-letter ISO country codes, for example "US" and "CA".',
      required: false,
    }),
    maximum_shipping_price: Property.Number({
      displayName: 'Maximum Shipping Price',
      description: 'Optional: only shipping rates up to this price qualify, for example 20. Leave empty for any rate.',
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
      description: 'Can be combined with product discounts. Off by default.',
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
      description: 'Can be combined with other shipping discounts. Off by default.',
      required: false,
      defaultValue: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Optional tags for the discount, for example "shipping".',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const title = shopifyValues.nonEmpty(propsValue.title);
    const code = shopifyValues.nonEmpty(propsValue.code);
    if (!title || !code) {
      throw new Error('Provide both title and code. Nothing was created.');
    }
    const maximumShippingPrice = shopifyValues.readNumber(propsValue.maximum_shipping_price);
    if (maximumShippingPrice !== undefined && !(maximumShippingPrice > 0)) {
      throw new Error('maximum_shipping_price must be above 0. Nothing was created.');
    }
    const usageLimit = shopifyValues.readNumber(propsValue.usage_limit);
    if (usageLimit !== undefined && (!Number.isInteger(usageLimit) || usageLimit < 1)) {
      throw new Error('usage_limit must be a whole number of 1 or more. Nothing was created.');
    }
    const freeShippingCodeDiscount = shopifyValues.compact({
      title,
      code,
      startsAt: shopifyValues.nonEmpty(propsValue.starts_at) ?? new Date().toISOString(),
      endsAt: shopifyValues.nonEmpty(propsValue.ends_at),
      destination: buildDestination({ destination: propsValue.destination, countryCodes: propsValue.country_codes }),
      maximumShippingPrice: maximumShippingPrice === undefined ? undefined : String(maximumShippingPrice),
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
      usageLimit,
      appliesOncePerCustomer: propsValue.applies_once_per_customer ?? false,
      combinesWith: shopifyValues.buildCombinesWith({
        productDiscounts: propsValue.combines_with_product_discounts ?? false,
        orderDiscounts: propsValue.combines_with_order_discounts ?? false,
        shippingDiscounts: propsValue.combines_with_shipping_discounts ?? false,
      }),
      tags: shopifyValues.nonEmptyList(propsValue.tags),
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      discountCodeFreeShippingCreate: { codeDiscountNode: GqlDiscountNode | null } | null;
    }>({
      auth,
      query: `mutation CreateFreeShippingDiscountCode($freeShippingCodeDiscount: DiscountCodeFreeShippingInput!) { discountCodeFreeShippingCreate(freeShippingCodeDiscount: $freeShippingCodeDiscount) { codeDiscountNode { id discount: codeDiscount { ${shopifyFields.CODE_DISCOUNT_DETAIL_FIELDS} } } userErrors { field message code } } }`,
      variables: { freeShippingCodeDiscount },
    });
    const node = data.discountCodeFreeShippingCreate?.codeDiscountNode;
    if (!node) {
      throw new Error('Shopify did not return the new discount.');
    }
    return {
      ...shopifyMappers.mapDiscountNode(node),
      redacted_fields: redactedFields,
    };
  },
});

function buildDestination({
  destination,
  countryCodes,
}: {
  destination: string | undefined;
  countryCodes: unknown;
}): Record<string, unknown> {
  const codes = (shopifyValues.nonEmptyList(countryCodes) ?? []).map((code) => code.toUpperCase());
  const target = destination ?? (codes.length > 0 ? 'COUNTRIES' : 'ALL');
  if (target === 'ALL') {
    if (codes.length > 0) {
      throw new Error('destination ALL cannot be combined with country_codes; choose COUNTRIES. Nothing was created.');
    }
    return { all: true };
  }
  if (codes.length === 0) {
    throw new Error('destination COUNTRIES needs at least one country code such as "US". Nothing was created.');
  }
  const invalid = codes.filter((code) => !/^[A-Z]{2}$/.test(code));
  if (invalid.length > 0) {
    throw new Error(`Country codes must be two letters, got: ${invalid.join(', ')}. Nothing was created.`);
  }
  return { countries: { add: codes } };
}
