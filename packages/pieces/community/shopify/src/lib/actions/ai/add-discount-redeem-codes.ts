import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlDiscountRedeemCodeBulkCreation,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiAddDiscountRedeemCodes = createAction({
  auth: shopifyAuth,
  name: 'add_discount_redeem_codes',
  classification: 'WRITE',
  displayName: 'Start Adding Discount Redeem Codes',
  description: 'Start adding up to 250 new redeem codes to a code discount (runs in the background).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Starts adding up to 250 new redeem codes to one existing code discount, for example unique codes for an email campaign. Shopify imports them in the background and returns only a bulk creation: poll get_discount_redeem_code_bulk_creation with bulk_creation_id until done is true, then read imported_count, failed_count and the per-code errors (for example a code that already exists). Every call starts another import. Takes the full code discount id (gid://shopify/DiscountCodeNode/…); a plain number is rejected as ambiguous. Needs the write_discounts access scope.',
    idempotent: false,
  },
  props: {
    discount_id: Property.ShortText({
      displayName: 'Discount ID',
      description:
        'The full code discount id, for example "gid://shopify/DiscountCodeNode/123". Get it from list_discounts or find_discount_by_code.',
      required: true,
    }),
    codes: Property.Array({
      displayName: 'Codes',
      description: 'The new codes, 1 to 250, for example "WELCOME-A1B2". Duplicates in the list are sent once.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const discountId = shopifyValues.toDiscountCodeNodeId(propsValue.discount_id);
    const codes = [...new Set(shopifyValues.readStringList(propsValue.codes) ?? [])];
    if (codes.length === 0) {
      throw new Error('Provide at least one code. Nothing was started.');
    }
    if (codes.length > shopifyFields.MAX_REDEEM_CODES_PER_CALL) {
      throw new Error(
        `Shopify accepts at most ${shopifyFields.MAX_REDEEM_CODES_PER_CALL} codes per call; got ${codes.length}. Split them over several calls. Nothing was started.`
      );
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      discountRedeemCodeBulkAdd: { bulkCreation: GqlDiscountRedeemCodeBulkCreation | null } | null;
    }>({
      auth,
      query: `mutation AddDiscountRedeemCodes($discountId: ID!, $codes: [DiscountRedeemCodeInput!]!) { discountRedeemCodeBulkAdd(discountId: $discountId, codes: $codes) { bulkCreation { id done codesCount importedCount failedCount createdAt discountCode { id } } userErrors { field message code } } }`,
      variables: { discountId, codes: codes.map((code) => ({ code })) },
    });
    return {
      ...shopifyMappers.mapDiscountBulkCreation(data.discountRedeemCodeBulkAdd?.bulkCreation),
      discount_id: discountId,
      codes_sent: codes.length,
      redacted_fields: redactedFields,
    };
  },
});
