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
import { listCustomerOrdersOutputSchema } from '../../output-schemas/orders';

const MAX_PAGE_SIZE = 40;

export const shopifyAiListCustomerOrders = createAction({
  auth: shopifyAuth,
  name: 'list_customer_orders',
  classification: 'SEARCH',
  displayName: 'List Customer Orders',
  description: 'List the orders of one customer, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the orders placed by one customer as order summaries (no line items), newest last unless reversed, optionally filtered with order search syntax such as "financial_status:paid". Use get_order for the full order. Paged: pass end_cursor back as the cursor while has_next_page is true. Without the read_all_orders scope only the last 60 days are visible.',
    idempotent: true,
  },
  outputSchema: listCustomerOrdersOutputSchema,
  props: {
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'The customer id, numeric or "gid://shopify/Customer/…". Find it with search_customers.',
      required: true,
    }),
    query: shopifyProps.searchQuery(
      'Optional order search syntax to narrow the list, for example "financial_status:paid" or "created_at:>=2026-01-01".'
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
          { label: 'ID', value: 'ID' },
        ],
      },
    }),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Customer', id: propsValue.customer_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      customer: { id: string; orders?: GqlConnection<GqlOrder> | null } | null;
    }>({
      auth,
      primaryPaths: ['customer.orders'],
      query: `query ListCustomerOrders($id: ID!, $first: Int!, $after: String, $query: String, $sortKey: OrderSortKeys, $reverse: Boolean) { customer(id: $id) { id orders(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) { nodes { ${shopifyFields.ORDER_SUMMARY_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } } }`,
      variables: {
        id,
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        query: shopifyValues.nonEmpty(propsValue.query),
        sortKey: propsValue.sort_key,
        reverse: propsValue.reverse ?? false,
      },
    });
    if (!data.customer) {
      throw new Error(`Customer ${id} was not found.`);
    }
    return {
      customer_id: data.customer.id,
      ...shopifyMappers.toPage({
        connection: data.customer.orders,
        map: shopifyMappers.mapOrderSummary,
        redactedFields,
      }),
    };
  },
});
