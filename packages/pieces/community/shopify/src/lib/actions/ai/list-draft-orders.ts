import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlDraftOrder,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

const MAX_PAGE_SIZE = 60;

export const shopifyAiListDraftOrders = createAction({
  auth: shopifyAuth,
  name: 'list_draft_orders',
  classification: 'SEARCH',
  displayName: 'List Draft Orders',
  description: 'Search draft orders, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches draft orders with Shopify search syntax (for example "status:open" or "customer_id:207119551") and returns one page of draft summaries without line items; use get_draft_order for the full draft. Paged: pass end_cursor back as the cursor while has_next_page is true. Read-only.',
    idempotent: true,
  },
  props: {
    query: shopifyProps.searchQuery(
      'Shopify draft order search syntax, for example "status:open", "status:invoice_sent" or "tag:quote". Leave empty for all.'
    ),
    sort_key: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort by. Defaults to the draft id.',
      required: false,
      options: {
        options: [
          { label: 'Updated at', value: 'UPDATED_AT' },
          { label: 'Number', value: 'NUMBER' },
          { label: 'Status', value: 'STATUS' },
          { label: 'Total price', value: 'TOTAL_PRICE' },
          { label: 'Customer name', value: 'CUSTOMER_NAME' },
          { label: 'Relevance (with a query)', value: 'RELEVANCE' },
          { label: 'ID', value: 'ID' },
        ],
      },
    }),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      draftOrders: GqlConnection<GqlDraftOrder>;
    }>({
      auth,
      query: `query ListDraftOrders($first: Int!, $after: String, $query: String, $sortKey: DraftOrderSortKeys, $reverse: Boolean) { draftOrders(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) { nodes { ${shopifyFields.DRAFT_ORDER_SUMMARY_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        query: shopifyValues.nonEmpty(propsValue.query),
        sortKey: propsValue.sort_key,
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.draftOrders,
      map: shopifyMappers.mapDraftOrderSummary,
      redactedFields,
    });
  },
});
