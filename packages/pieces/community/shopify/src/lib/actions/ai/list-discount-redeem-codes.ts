import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlDiscountRedeemCode,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import { listDiscountRedeemCodesOutputSchema } from '../../output-schemas/fulfillment';

const MAX_PAGE_SIZE = 250;

export const shopifyAiListDiscountRedeemCodes = createAction({
  auth: shopifyAuth,
  name: 'list_discount_redeem_codes',
  classification: 'SEARCH',
  displayName: 'List Discount Redeem Codes',
  description: 'List the redeem codes of a code discount with their usage counts.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the redeem codes (the strings customers type) of one code discount, with each code\'s id and usage count; the code ids are what delete_discount_redeem_codes takes. Optionally filter with "times_used:<n>" (for example "times_used:0") or plain text matched against the code (for example "SUMMER"); Shopify ignores other field filters such as "code:" and would list every code, so they are rejected. Takes the code discount id (gid://shopify/DiscountCodeNode/… or its plain number); automatic discounts have no codes. Paged: pass end_cursor back as the cursor while has_next_page is true. Needs the read_discounts access scope. Read-only.',
    idempotent: true,
  },
  outputSchema: listDiscountRedeemCodesOutputSchema,
  props: {
    discount_id: Property.ShortText({
      displayName: 'Discount ID',
      description:
        'The code discount id, for example "gid://shopify/DiscountCodeNode/123" or "123". Get it from list_discounts or find_discount_by_code.',
      required: true,
    }),
    query: shopifyProps.searchQuery(
      'Optional filter: "times_used:<n>" such as "times_used:0", or plain text matched against the code such as "SUMMER". Other field filters (for example "code:") are rejected. Leave empty to list all.'
    ),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const id = shopifyValues.toDiscountCodeNodeId(propsValue.discount_id);
    const codesSelection = `codes(first: $first, after: $after, query: $query) { nodes { id code asyncUsageCount createdBy { id title } } ${shopifyFields.PAGE_INFO_FIELDS} }`;
    const fragments = shopifyFields.CODE_DISCOUNT_TYPES.map((type) => `... on ${type} { ${codesSelection} }`).join(' ');
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      discountNode: {
        id: string;
        discount?: { __typename?: string; codes?: GqlConnection<GqlDiscountRedeemCode> | null } | null;
      } | null;
    }>({
      auth,
      query: `query ListDiscountRedeemCodes($id: ID!, $first: Int!, $after: String, $query: String) { discountNode(id: $id) { id discount { __typename ${fragments} } } }`,
      variables: {
        id,
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        query: shopifyValues.readRedeemCodeSearch(propsValue.query),
      },
      primaryPaths: ['discountNode.discount.codes'],
    });
    if (!data.discountNode) {
      throw new Error(`Discount ${id} was not found.`);
    }
    return {
      discount_id: id,
      discount_type: data.discountNode.discount?.__typename ?? null,
      ...shopifyMappers.toPage({
        connection: data.discountNode.discount?.codes,
        map: shopifyMappers.mapDiscountRedeemCode,
        redactedFields,
      }),
    };
  },
});
