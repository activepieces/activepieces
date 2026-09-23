import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlDiscountNode,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiGetDiscount = createAction({
  auth: shopifyAuth,
  name: 'get_discount',
  classification: 'READ',
  displayName: 'Get Discount',
  description: 'Get one discount (code or automatic) with its value, target, eligibility and limits.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one discount, code or automatic, of any kind (amount off, buy X get Y, free shipping, app). Includes method (code or automatic), discount_type, title, status, summary, dates, usage count, value (percentage as a percent number, or amount), what it applies to (up to 25 product, variant or collection ids; items_truncated when more), eligibility (ALL, CUSTOMERS or SEGMENTS with ids), minimum requirement, combinations, usage limits and, for code discounts, the code count and up to 10 codes (use list_discount_redeem_codes for all). Takes the full discount id (gid://shopify/DiscountCodeNode/… or gid://shopify/DiscountAutomaticNode/…); a plain number is rejected as ambiguous. Needs the read_discounts access scope. Read-only.',
    idempotent: true,
  },
  props: {
    discount_id: Property.ShortText({
      displayName: 'Discount ID',
      description:
        'The full discount id, for example "gid://shopify/DiscountCodeNode/123" or "gid://shopify/DiscountAutomaticNode/456". Get it from list_discounts or find_discount_by_code.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { id } = shopifyValues.readDiscountId({
      value: propsValue.discount_id,
      allow: ['code', 'automatic', 'node'],
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      discountNode: GqlDiscountNode | null;
    }>({
      auth,
      query: `query GetDiscount($id: ID!) { discountNode(id: $id) { id discount { ${shopifyFields.DISCOUNT_DETAIL_FIELDS} } } }`,
      variables: { id },
    });
    if (!data.discountNode) {
      throw new Error(`Discount ${id} was not found.`);
    }
    return {
      ...shopifyMappers.mapDiscountNode(data.discountNode),
      redacted_fields: redactedFields,
    };
  },
});
