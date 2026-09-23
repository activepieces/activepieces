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

export const shopifyAiUpdateFreeShippingDiscountCode = createAction({
  auth: shopifyAuth,
  name: 'update_free_shipping_discount_code',
  classification: 'WRITE',
  displayName: 'Update Free Shipping Discount Code',
  description: 'Change an existing free shipping discount code.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates one free shipping code discount (created by create_free_shipping_discount_code or in the admin) and returns it. Only the fields you supply are sent; an empty update is rejected. Several parts are REPLACED as a whole when sent, so send them complete: (1) destination: ALL countries, or COUNTRIES with the codes to add in country_codes_to_add and the codes to drop in country_codes_to_remove (left unset, it becomes COUNTRIES when any country code is given); (2) eligibility with its customer or segment ids; (3) combines_with: all three combines_with_* choices together; (4) tags: the full tag list. minimum_requirement NONE removes the minimum; remove_end_date Yes clears the end date so the code never expires, and remove_usage_limit Yes clears the total usage limit (neither can be combined with a new ends_at or usage_limit). Takes the full discount id (gid://shopify/DiscountCodeNode/…); a plain number is rejected because code and automatic discounts are different objects. Read the current settings with get_discount first. Repeating the same update leaves the same state. Amount-off codes are edited with update_basic_discount_code; automatic discounts cannot be edited here. Needs the write_discounts access scope.',
    idempotent: true,
  },
  props: {
    discount_id: Property.ShortText({
      displayName: 'Discount ID',
      description:
        'The full code discount id, for example "gid://shopify/DiscountCodeNode/123". Get it from list_discounts, get_discount or find_discount_by_code.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New internal title. Leave empty to keep it.',
      required: false,
    }),
    code: Property.ShortText({
      displayName: 'Code',
      description: 'New code customers enter. Leave empty to keep it.',
      required: false,
    }),
    starts_at: Property.DateTime({
      displayName: 'Starts At',
      description: 'New start, ISO 8601. Leave empty to keep it.',
      required: false,
    }),
    ends_at: Property.DateTime({
      displayName: 'Ends At',
      description: 'New end, ISO 8601. Leave empty to keep it. To remove the end date use remove_end_date.',
      required: false,
    }),
    remove_end_date: shopifyProps.booleanChoice({
      displayName: 'Remove End Date',
      description: 'Yes: clear the end date so the code no longer expires. Cannot be combined with ends_at. Leave unset to keep the end date.',
    }),
    destination: Property.StaticDropdown({
      displayName: 'Destination',
      description: 'Where free shipping applies; replaces the current destination. Leave unset to keep it, or to use COUNTRIES when country codes are given.',
      required: false,
      options: {
        options: [
          { label: 'All countries', value: 'ALL' },
          { label: 'Specific countries', value: 'COUNTRIES' },
        ],
      },
    }),
    country_codes_to_add: Property.Array({
      displayName: 'Country Codes To Add',
      description: 'With destination COUNTRIES: two-letter ISO country codes where free shipping should apply, for example "US" and "CA".',
      required: false,
    }),
    country_codes_to_remove: Property.Array({
      displayName: 'Country Codes To Remove',
      description: 'With destination COUNTRIES: two-letter ISO country codes to take out, for example "MX".',
      required: false,
    }),
    maximum_shipping_price: Property.Number({
      displayName: 'Maximum Shipping Price',
      description: 'New cap on the shipping rate the code covers, above 0, for example 20. Leave empty to keep it.',
      required: false,
    }),
    eligibility: Property.StaticDropdown({
      displayName: 'Eligibility',
      description: 'Who can use the code. Replaces the current eligibility.',
      required: false,
      options: {
        options: [
          { label: 'All buyers', value: 'ALL' },
          { label: 'Specific customers', value: 'CUSTOMERS' },
          { label: 'Customer segments', value: 'SEGMENTS' },
        ],
      },
    }),
    customer_ids_to_add: shopifyProps.idList({
      displayName: 'Customer IDs To Add',
      description: 'With eligibility CUSTOMERS: customers who can use the code, numeric or "gid://shopify/Customer/…".',
    }),
    customer_ids_to_remove: shopifyProps.idList({
      displayName: 'Customer IDs To Remove',
      description: 'With eligibility CUSTOMERS: customers who should no longer be able to use it.',
    }),
    segment_ids_to_add: shopifyProps.idList({
      displayName: 'Segment IDs To Add',
      description: 'With eligibility SEGMENTS: segments that can use the code, numeric or "gid://shopify/Segment/…".',
    }),
    segment_ids_to_remove: shopifyProps.idList({
      displayName: 'Segment IDs To Remove',
      description: 'With eligibility SEGMENTS: segments that should no longer be able to use it.',
    }),
    minimum_requirement: Property.StaticDropdown({
      displayName: 'Minimum Requirement',
      description: 'New minimum, or NONE to remove it. Leave unset to keep the current one.',
      required: false,
      options: {
        options: [
          { label: 'None (remove the minimum)', value: 'NONE' },
          { label: 'Minimum subtotal', value: 'SUBTOTAL' },
          { label: 'Minimum quantity of items', value: 'QUANTITY' },
        ],
      },
    }),
    minimum_value: Property.Number({
      displayName: 'Minimum Value',
      description: 'With SUBTOTAL or QUANTITY: the subtotal or the whole-number item quantity.',
      required: false,
    }),
    usage_limit: Property.Number({
      displayName: 'Usage Limit',
      description: 'New total usage limit, a whole number of 1 or more. Leave empty to keep it. To remove the limit use remove_usage_limit.',
      required: false,
    }),
    remove_usage_limit: shopifyProps.booleanChoice({
      displayName: 'Remove Usage Limit',
      description: 'Yes: clear the total usage limit so the code can be used any number of times. Cannot be combined with usage_limit. Leave unset to keep the limit.',
    }),
    applies_once_per_customer: shopifyProps.booleanChoice({
      displayName: 'Once Per Customer',
      description: 'Yes: each customer can use it once. No: no per-customer limit. Leave unset to keep it.',
    }),
    combines_with_product_discounts: shopifyProps.booleanChoice({
      displayName: 'Combines With Product Discounts',
      description: 'Set all three combines_with choices together; they replace the current combinations.',
    }),
    combines_with_order_discounts: shopifyProps.booleanChoice({
      displayName: 'Combines With Order Discounts',
      description: 'Set all three combines_with choices together; they replace the current combinations.',
    }),
    combines_with_shipping_discounts: shopifyProps.booleanChoice({
      displayName: 'Combines With Shipping Discounts',
      description: 'Set all three combines_with choices together; they replace the current combinations.',
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'The complete new tag list; replaces the current tags. Leave empty to keep them.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyValues.toDiscountCodeNodeId(propsValue.discount_id);
    const maximumShippingPrice = shopifyValues.readNumber(propsValue.maximum_shipping_price);
    if (maximumShippingPrice !== undefined && !(maximumShippingPrice > 0)) {
      throw new Error('maximum_shipping_price must be above 0. Nothing was changed.');
    }
    const usageLimit = shopifyValues.readNumber(propsValue.usage_limit);
    if (usageLimit !== undefined && (!Number.isInteger(usageLimit) || usageLimit < 1)) {
      throw new Error('usage_limit must be a whole number of 1 or more. Nothing was changed.');
    }
    const freeShippingCodeDiscount = shopifyValues.compact({
      title: shopifyValues.nonEmpty(propsValue.title),
      code: shopifyValues.nonEmpty(propsValue.code),
      startsAt: shopifyValues.nonEmpty(propsValue.starts_at),
      endsAt: shopifyValues.clearableValue({
        value: shopifyValues.nonEmpty(propsValue.ends_at),
        clear: shopifyValues.toBooleanChoice(propsValue.remove_end_date),
        valueName: 'ends_at',
        clearName: 'remove_end_date',
      }),
      destination: buildDestinationUpdate({
        destination: propsValue.destination,
        countryCodesToAdd: propsValue.country_codes_to_add,
        countryCodesToRemove: propsValue.country_codes_to_remove,
      }),
      maximumShippingPrice: maximumShippingPrice === undefined ? undefined : String(maximumShippingPrice),
      context: shopifyValues.buildDiscountContext({
        eligibility: propsValue.eligibility,
        customerIdsToAdd: propsValue.customer_ids_to_add,
        customerIdsToRemove: propsValue.customer_ids_to_remove,
        segmentIdsToAdd: propsValue.segment_ids_to_add,
        segmentIdsToRemove: propsValue.segment_ids_to_remove,
      }),
      minimumRequirement: shopifyValues.buildMinimumRequirement({
        kind: propsValue.minimum_requirement,
        value: shopifyValues.readNumber(propsValue.minimum_value),
      }),
      usageLimit: shopifyValues.clearableValue({
        value: usageLimit,
        clear: shopifyValues.toBooleanChoice(propsValue.remove_usage_limit),
        valueName: 'usage_limit',
        clearName: 'remove_usage_limit',
      }),
      appliesOncePerCustomer: shopifyValues.toBooleanChoice(propsValue.applies_once_per_customer),
      combinesWith: shopifyValues.buildCombinesWith({
        productDiscounts: shopifyValues.toBooleanChoice(propsValue.combines_with_product_discounts),
        orderDiscounts: shopifyValues.toBooleanChoice(propsValue.combines_with_order_discounts),
        shippingDiscounts: shopifyValues.toBooleanChoice(propsValue.combines_with_shipping_discounts),
      }),
      tags: shopifyValues.nonEmptyList(propsValue.tags),
    });
    if (Object.keys(freeShippingCodeDiscount).length === 0) {
      throw new Error('Nothing to update: provide at least one field to change. Nothing was changed.');
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      discountCodeFreeShippingUpdate: { codeDiscountNode: GqlDiscountNode | null } | null;
    }>({
      auth,
      query: `mutation UpdateFreeShippingDiscountCode($id: ID!, $freeShippingCodeDiscount: DiscountCodeFreeShippingInput!) { discountCodeFreeShippingUpdate(id: $id, freeShippingCodeDiscount: $freeShippingCodeDiscount) { codeDiscountNode { id discount: codeDiscount { ${shopifyFields.CODE_DISCOUNT_DETAIL_FIELDS} } } userErrors { field message code } } }`,
      variables: { id, freeShippingCodeDiscount },
    });
    const node = data.discountCodeFreeShippingUpdate?.codeDiscountNode;
    if (!node) {
      throw new Error('Shopify did not return the updated discount.');
    }
    return {
      ...shopifyMappers.mapDiscountNode(node),
      redacted_fields: redactedFields,
    };
  },
});

function buildDestinationUpdate({
  destination,
  countryCodesToAdd,
  countryCodesToRemove,
}: {
  destination: string | undefined;
  countryCodesToAdd: unknown;
  countryCodesToRemove: unknown;
}): Record<string, unknown> | undefined {
  const add = readCountryCodes(countryCodesToAdd);
  const remove = readCountryCodes(countryCodesToRemove);
  const hasCodes = add.length > 0 || remove.length > 0;
  const target = destination ?? (hasCodes ? 'COUNTRIES' : undefined);
  if (target === undefined) {
    return undefined;
  }
  if (target === 'ALL') {
    if (hasCodes) {
      throw new Error('destination ALL cannot be combined with country codes; choose COUNTRIES. Nothing was changed.');
    }
    return { all: true };
  }
  if (target === 'COUNTRIES') {
    if (!hasCodes) {
      throw new Error('destination COUNTRIES needs country_codes_to_add or country_codes_to_remove, for example "US". Nothing was changed.');
    }
    return {
      countries: shopifyValues.compact({
        add: add.length > 0 ? add : undefined,
        remove: remove.length > 0 ? remove : undefined,
      }),
    };
  }
  throw new Error(`Unknown destination "${target}". Use ALL or COUNTRIES. Nothing was changed.`);
}

function readCountryCodes(value: unknown): string[] {
  const codes = (shopifyValues.nonEmptyList(value) ?? []).map((code) => code.trim().toUpperCase());
  const invalid = codes.filter((code) => !/^[A-Z]{2}$/.test(code));
  if (invalid.length > 0) {
    throw new Error(`Country codes must be two letters, got: ${invalid.join(', ')}. Nothing was changed.`);
  }
  return codes;
}
