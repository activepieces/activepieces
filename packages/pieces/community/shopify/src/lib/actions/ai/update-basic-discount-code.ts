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

export const shopifyAiUpdateBasicDiscountCode = createAction({
  auth: shopifyAuth,
  name: 'update_basic_discount_code',
  classification: 'WRITE',
  displayName: 'Update Amount-Off Discount Code',
  description: 'Change an existing percentage or fixed-amount discount code.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates one amount-off code discount (created by create_basic_discount_code or in the admin) and returns it. Only the fields you supply are sent; an empty update is rejected. Several parts are REPLACED as a whole when sent, so send them complete: (1) the discount value and target: value_type, value and applies_to must be given together, and with PRODUCTS or COLLECTIONS the ids go in the *_to_add lists (ids to drop in *_to_remove). To change only the value of a product or collection discount, read it with get_discount and re-send its applies_to with one of its current product_ids, variant_ids or collection_ids in the matching *_to_add list, which keeps the targets unchanged; (2) eligibility with its customer or segment ids; (3) combines_with: all three combines_with_* choices together; (4) tags: the full tag list. minimum_requirement NONE removes the minimum; remove_end_date Yes clears the end date so the code never expires, and remove_usage_limit Yes clears the total usage limit (neither can be combined with a new ends_at or usage_limit). Takes the code discount id (gid://shopify/DiscountCodeNode/… or its plain number). Repeating the same update leaves the same state. Automatic discounts cannot be edited here. Needs the write_discounts access scope.',
    idempotent: true,
  },
  outputSchema: discountOutputSchema,
  props: {
    discount_id: Property.ShortText({
      displayName: 'Discount ID',
      description:
        'The code discount id, for example "gid://shopify/DiscountCodeNode/123" or "123". Get it from list_discounts, get_discount or find_discount_by_code.',
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
    value_type: Property.StaticDropdown({
      displayName: 'Value Type',
      description: 'Percentage or fixed amount. Send together with value and applies_to.',
      required: false,
      options: {
        options: [
          { label: 'Percentage', value: 'PERCENTAGE' },
          { label: 'Fixed amount', value: 'FIXED_AMOUNT' },
        ],
      },
    }),
    value: Property.Number({
      displayName: 'Value',
      description: 'For PERCENTAGE the percent (15 means 15% off). For FIXED_AMOUNT the amount in the shop currency.',
      required: false,
    }),
    applies_on_each_item: shopifyProps.booleanChoice({
      displayName: 'Apply Amount To Each Item',
      description: 'FIXED_AMOUNT only: Yes takes the amount off every eligible item, No once per order.',
    }),
    applies_to: Property.StaticDropdown({
      displayName: 'Applies To',
      description: 'What the discount applies to. Send together with value_type and value.',
      required: false,
      options: {
        options: [
          { label: 'All items', value: 'ALL' },
          { label: 'Specific products or variants', value: 'PRODUCTS' },
          { label: 'Specific collections', value: 'COLLECTIONS' },
        ],
      },
    }),
    product_ids_to_add: shopifyProps.idList({
      displayName: 'Product IDs To Add',
      description: 'With applies_to PRODUCTS: products the discount applies to, numeric or "gid://shopify/Product/…".',
    }),
    product_ids_to_remove: shopifyProps.idList({
      displayName: 'Product IDs To Remove',
      description: 'With applies_to PRODUCTS: products to take out of the discount.',
    }),
    variant_ids_to_add: shopifyProps.idList({
      displayName: 'Variant IDs To Add',
      description: 'With applies_to PRODUCTS: variants the discount applies to, numeric or "gid://shopify/ProductVariant/…".',
    }),
    variant_ids_to_remove: shopifyProps.idList({
      displayName: 'Variant IDs To Remove',
      description: 'With applies_to PRODUCTS: variants to take out of the discount.',
    }),
    collection_ids_to_add: shopifyProps.idList({
      displayName: 'Collection IDs To Add',
      description: 'With applies_to COLLECTIONS: collections the discount applies to, numeric or "gid://shopify/Collection/…".',
    }),
    collection_ids_to_remove: shopifyProps.idList({
      displayName: 'Collection IDs To Remove',
      description: 'With applies_to COLLECTIONS: collections to take out of the discount.',
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
    const value = shopifyValues.buildDiscountValue({
      valueType: propsValue.value_type,
      value: shopifyValues.readNumber(propsValue.value),
      appliesOnEachItem: shopifyValues.toBooleanChoice(propsValue.applies_on_each_item),
    });
    const items = shopifyValues.buildDiscountItems({
      appliesTo: propsValue.applies_to,
      productIdsToAdd: propsValue.product_ids_to_add,
      productIdsToRemove: propsValue.product_ids_to_remove,
      variantIdsToAdd: propsValue.variant_ids_to_add,
      variantIdsToRemove: propsValue.variant_ids_to_remove,
      collectionIdsToAdd: propsValue.collection_ids_to_add,
      collectionIdsToRemove: propsValue.collection_ids_to_remove,
    });
    if ((value === undefined) !== (items === undefined)) {
      throw new Error(
        'The discount value and target are replaced together: send value_type, value and applies_to in the same call. Nothing was changed.'
      );
    }
    const usageLimit = shopifyValues.readNumber(propsValue.usage_limit);
    if (usageLimit !== undefined && (!Number.isInteger(usageLimit) || usageLimit < 1)) {
      throw new Error('usage_limit must be a whole number of 1 or more. Nothing was changed.');
    }
    const basicCodeDiscount = shopifyValues.compact({
      title: shopifyValues.nonEmpty(propsValue.title),
      code: shopifyValues.nonEmpty(propsValue.code),
      startsAt: shopifyValues.nonEmpty(propsValue.starts_at),
      endsAt: shopifyValues.clearableValue({
        value: shopifyValues.nonEmpty(propsValue.ends_at),
        clear: shopifyValues.toBooleanChoice(propsValue.remove_end_date),
        valueName: 'ends_at',
        clearName: 'remove_end_date',
      }),
      customerGets: value && items ? { value, items } : undefined,
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
    if (Object.keys(basicCodeDiscount).length === 0) {
      throw new Error('Nothing to update: provide at least one field to change. Nothing was changed.');
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      discountCodeBasicUpdate: { codeDiscountNode: GqlDiscountNode | null } | null;
    }>({
      auth,
      query: `mutation UpdateBasicDiscountCode($id: ID!, $basicCodeDiscount: DiscountCodeBasicInput!) { discountCodeBasicUpdate(id: $id, basicCodeDiscount: $basicCodeDiscount) { codeDiscountNode { id discount: codeDiscount { ${shopifyFields.CODE_DISCOUNT_DETAIL_FIELDS} } } userErrors { field message code } } }`,
      variables: { id, basicCodeDiscount },
    });
    const node = data.discountCodeBasicUpdate?.codeDiscountNode;
    if (!node) {
      throw new Error('Shopify did not return the updated discount.');
    }
    return {
      ...shopifyMappers.mapDiscountNode(node),
      redacted_fields: redactedFields,
    };
  },
});
