import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlDiscountNode,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import { listDiscountsOutputSchema } from '../../output-schemas/fulfillment';

const MAX_PAGE_SIZE = 45;

export const shopifyAiListDiscounts = createAction({
  auth: shopifyAuth,
  name: 'list_discounts',
  classification: 'SEARCH',
  displayName: 'List Discounts',
  description: 'List and search discounts (code and automatic) with their status and dates.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the store\'s discounts, code and automatic, of every kind. Filter with Shopify search syntax, for example "status:active", "method:code", "method:automatic", "type:free_shipping", "title:Spring*" or "starts_at:>2026-01-01". Each item has the full discount id (gid://shopify/DiscountCodeNode/… or gid://shopify/DiscountAutomaticNode/…) that the other discount actions take, method, discount_type, title, status, summary, dates, usage count, eligibility, combinations and, for code discounts, the code count and first code. Use get_discount for value and targets. Paged: pass end_cursor back as the cursor while has_next_page is true. Needs the read_discounts access scope. Read-only.',
    idempotent: true,
  },
  outputSchema: listDiscountsOutputSchema,
  props: {
    query: shopifyProps.searchQuery(
      'Shopify discount search syntax, for example "status:active method:code" or "title:Spring*". Leave empty to list all.'
    ),
    sort_key: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort by. Defaults to the id.',
      required: false,
      options: {
        options: [
          { label: 'ID', value: 'ID' },
          { label: 'Title', value: 'TITLE' },
          { label: 'Created at', value: 'CREATED_AT' },
          { label: 'Updated at', value: 'UPDATED_AT' },
          { label: 'Starts at', value: 'STARTS_AT' },
          { label: 'Ends at', value: 'ENDS_AT' },
          { label: 'Relevance (with a query)', value: 'RELEVANCE' },
        ],
      },
    }),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      discountNodes: GqlConnection<GqlDiscountNode>;
    }>({
      auth,
      query: `query ListDiscounts($first: Int!, $after: String, $query: String, $sortKey: DiscountSortKeys, $reverse: Boolean) { discountNodes(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) { nodes { id discount { ${shopifyFields.DISCOUNT_SUMMARY_FIELDS} } } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        query: shopifyValues.nonEmpty(propsValue.query),
        sortKey: propsValue.sort_key,
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.discountNodes,
      map: shopifyMappers.mapDiscountNode,
      redactedFields,
    });
  },
});
