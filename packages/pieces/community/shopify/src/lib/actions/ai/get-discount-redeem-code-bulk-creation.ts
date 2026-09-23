import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlDiscountRedeemCodeBulkCreation,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

const MAX_PAGE_SIZE = 60;

export const shopifyAiGetDiscountRedeemCodeBulkCreation = createAction({
  auth: shopifyAuth,
  name: 'get_discount_redeem_code_bulk_creation',
  classification: 'READ',
  displayName: 'Get Discount Redeem Code Bulk Creation',
  description: 'Check the progress and results of a redeem code import started by add_discount_redeem_codes.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads one redeem code import started by add_discount_redeem_codes: done, how many codes were sent, imported and failed, and one page of the submitted codes with the created code id or the errors for each (for example "has already been taken"). A single read, not a wait: call again later while done is false. Page through the codes with end_cursor while has_next_page is true. Needs the read_discounts access scope. Read-only.',
    idempotent: true,
  },
  props: {
    bulk_creation_id: Property.ShortText({
      displayName: 'Bulk Creation ID',
      description:
        'The bulk_creation_id returned by add_discount_redeem_codes, for example "gid://shopify/DiscountRedeemCodeBulkCreation/989355205" (a plain number is accepted).',
      required: true,
    }),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({
      type: 'DiscountRedeemCodeBulkCreation',
      id: propsValue.bulk_creation_id,
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      discountRedeemCodeBulkCreation:
        | (GqlDiscountRedeemCodeBulkCreation & { codes?: GqlConnection<GqlBulkCode> | null })
        | null;
    }>({
      auth,
      query: `query GetDiscountRedeemCodeBulkCreation($id: ID!, $first: Int!, $after: String) { discountRedeemCodeBulkCreation(id: $id) { id done codesCount importedCount failedCount createdAt discountCode { id } codes(first: $first, after: $after) { nodes { code discountRedeemCode { id } errors { field message code } } ${shopifyFields.PAGE_INFO_FIELDS} } } }`,
      variables: {
        id,
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
      },
    });
    const creation = data.discountRedeemCodeBulkCreation;
    if (!creation) {
      throw new Error(`Bulk creation ${id} was not found.`);
    }
    const page = shopifyMappers.toPage({ connection: creation.codes, map: mapBulkCode, redactedFields });
    return {
      ...shopifyMappers.mapDiscountBulkCreation(creation),
      codes: page.items,
      codes_on_page: page.count,
      has_next_page: page.has_next_page,
      end_cursor: page.end_cursor,
      redacted_fields: redactedFields,
    };
  },
});

function mapBulkCode(entry: GqlBulkCode) {
  return {
    code: entry.code ?? null,
    discount_redeem_code_id: entry.discountRedeemCode?.id ?? null,
    errors: (entry.errors ?? []).map((error) => ({
      field: Array.isArray(error.field) ? error.field.join('.') : null,
      message: error.message ?? null,
      code: error.code ?? null,
    })),
  };
}

type GqlBulkCode = {
  code?: string | null;
  discountRedeemCode?: { id: string } | null;
  errors?: { field?: string[] | null; message?: string | null; code?: string | null }[] | null;
};
