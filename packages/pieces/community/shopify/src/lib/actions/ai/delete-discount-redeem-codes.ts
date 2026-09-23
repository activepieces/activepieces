import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { GqlJob, shopifyGraphqlClient, shopifyValues } from '../../common/graphql';

export const shopifyAiDeleteDiscountRedeemCodes = createAction({
  auth: shopifyAuth,
  name: 'delete_discount_redeem_codes',
  classification: 'DESTRUCTIVE',
  displayName: 'Start Deleting Discount Redeem Codes',
  description: 'Start deleting redeem codes from a code discount (runs in the background).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Starts deleting redeem codes from one code discount, either the listed code ids (from list_discount_redeem_codes) or every code matching a search such as "times_used:0". Exactly one of code_ids or search is required, so nothing is deleted by accident. The discount itself stays (use delete_discount to remove it). Shopify deletes in the background and returns only a job: poll get_job with job_id until done is true. Deleted codes stop working at checkout and cannot be restored. Takes the full code discount id (gid://shopify/DiscountCodeNode/…); a plain number is rejected as ambiguous. Needs the write_discounts access scope.',
    idempotent: false,
  },
  props: {
    discount_id: Property.ShortText({
      displayName: 'Discount ID',
      description:
        'The full code discount id, for example "gid://shopify/DiscountCodeNode/123". Get it from list_discounts or find_discount_by_code.',
      required: true,
    }),
    code_ids: Property.Array({
      displayName: 'Code IDs',
      description:
        'The redeem code ids to delete, for example "gid://shopify/DiscountRedeemCode/241951653" (from list_discount_redeem_codes). Leave empty when using search.',
      required: false,
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description:
        'Delete every code of this discount matching this Shopify search, for example "times_used:0". Leave empty when using code_ids.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const discountId = shopifyValues.toDiscountCodeNodeId(propsValue.discount_id);
    const ids = shopifyValues.toGidList({ type: 'DiscountRedeemCode', value: propsValue.code_ids });
    const search = shopifyValues.nonEmpty(propsValue.search);
    if ((ids === undefined) === (search === undefined)) {
      throw new Error('Provide exactly one of code_ids or search. Nothing was deleted.');
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      discountCodeRedeemCodeBulkDelete: { job: GqlJob | null } | null;
    }>({
      auth,
      query: `mutation DeleteDiscountRedeemCodes($discountId: ID!, $ids: [ID!], $search: String) { discountCodeRedeemCodeBulkDelete(discountId: $discountId, ids: $ids, search: $search) { job { id done } userErrors { field message code } } }`,
      variables: { discountId, ids, search },
    });
    return {
      discount_id: discountId,
      job_id: data.discountCodeRedeemCodeBulkDelete?.job?.id ?? null,
      done: data.discountCodeRedeemCodeBulkDelete?.job?.done ?? false,
      redacted_fields: redactedFields,
    };
  },
});
