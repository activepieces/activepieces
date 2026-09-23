import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlCustomer,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

const MAX_PAGE_SIZE = 130;

export const shopifyAiSearchCustomers = createAction({
  auth: shopifyAuth,
  name: 'search_customers',
  classification: 'SEARCH',
  displayName: 'Search Customers',
  description: 'Search customers with Shopify search syntax, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches customers with Shopify search syntax (for example "email:jane@example.com", "phone:+16135551111", "tag:vip" or a plain name) and returns one page of customer profiles. Use get_customer_profile when you already have the id. Paged: pass end_cursor back as the cursor while has_next_page is true. Contact fields may be null on stores without protected customer data access (see redacted_fields).',
    idempotent: true,
  },
  props: {
    query: shopifyProps.searchQuery(
      'Shopify customer search syntax, for example "email:jane@example.com", "country:Canada" or "orders_count:>5". Leave empty to list all customers.'
    ),
    sort_key: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort by. Defaults to the customer id.',
      required: false,
      options: {
        options: [
          { label: 'Created at', value: 'CREATED_AT' },
          { label: 'Updated at', value: 'UPDATED_AT' },
          { label: 'Name', value: 'NAME' },
          { label: 'Location', value: 'LOCATION' },
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
      customers: GqlConnection<GqlCustomer>;
    }>({
      auth,
      query: `query SearchCustomers($first: Int!, $after: String, $query: String, $sortKey: CustomerSortKeys, $reverse: Boolean) { customers(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) { nodes { ${shopifyFields.CUSTOMER_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        query: shopifyValues.nonEmpty(propsValue.query),
        sortKey: propsValue.sort_key,
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.customers,
      map: shopifyMappers.mapCustomer,
      redactedFields,
    });
  },
});
