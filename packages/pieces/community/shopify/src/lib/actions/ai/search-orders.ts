import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlOrder,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import { searchOrdersOutputSchema } from '../../output-schemas/orders';

const MAX_PAGE_SIZE = 40;

export const shopifyAiSearchOrders = createAction({
  auth: shopifyAuth,
  name: 'search_orders',
  classification: 'SEARCH',
  displayName: 'Search Orders',
  description: 'Search orders with Shopify search syntax, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches orders with Shopify search syntax (for example "financial_status:paid created_at:>=2026-01-01" or "email:jane@example.com" or "name:#1001") and returns one page of order summaries without line items; use get_order for the full order. Paged: pass end_cursor back as the cursor while has_next_page is true. Without the read_all_orders scope only the last 60 days are visible.',
    idempotent: true,
  },
  outputSchema: searchOrdersOutputSchema,
  props: {
    query: shopifyProps.searchQuery(
      'Shopify order search syntax, for example "status:open financial_status:paid", "tag:wholesale" or "created_at:>=2026-01-01". Leave empty to list all orders.'
    ),
    sort_key: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort by. Defaults to the order id.',
      required: false,
      options: {
        options: [
          { label: 'Created at', value: 'CREATED_AT' },
          { label: 'Processed at', value: 'PROCESSED_AT' },
          { label: 'Updated at', value: 'UPDATED_AT' },
          { label: 'Order number', value: 'ORDER_NUMBER' },
          { label: 'Total price', value: 'TOTAL_PRICE' },
          { label: 'Customer name', value: 'CUSTOMER_NAME' },
          { label: 'Financial status', value: 'FINANCIAL_STATUS' },
          { label: 'Fulfillment status', value: 'FULFILLMENT_STATUS' },
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
      orders: GqlConnection<GqlOrder>;
    }>({
      auth,
      query: `query SearchOrders($first: Int!, $after: String, $query: String, $sortKey: OrderSortKeys, $reverse: Boolean) { orders(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) { nodes { ${shopifyFields.ORDER_SUMMARY_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        query: shopifyValues.nonEmpty(propsValue.query),
        sortKey: propsValue.sort_key,
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.orders,
      map: shopifyMappers.mapOrderSummary,
      redactedFields,
    });
  },
});
