import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlAbandonedCheckout,
  GqlConnection,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import { listAbandonedCheckoutsOutputSchema } from '../../output-schemas/orders';

const MAX_PAGE_SIZE = 100;

export const shopifyAiListAbandonedCheckouts = createAction({
  auth: shopifyAuth,
  name: 'list_abandoned_checkouts',
  classification: 'SEARCH',
  displayName: 'List Abandoned Checkouts',
  description: 'List checkouts that customers started but did not complete.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists abandoned checkouts with total, customer and the recovery URL to send to the shopper. Supports search syntax such as "created_at:>=2026-09-01". Use get_checkout_abandonment for the marketing-email state of one checkout. Paged: pass end_cursor back as the cursor while has_next_page is true. Customer name and email may be null on stores without protected customer data access (see redacted_fields).',
    idempotent: true,
  },
  outputSchema: listAbandonedCheckoutsOutputSchema,
  props: {
    query: shopifyProps.searchQuery(
      'Shopify search syntax, for example "created_at:>=2026-09-01" or "status:open". Leave empty for all.'
    ),
    sort_key: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort by. Defaults to the checkout id.',
      required: false,
      options: {
        options: [
          { label: 'Created at', value: 'CREATED_AT' },
          { label: 'Checkout id', value: 'CHECKOUT_ID' },
          { label: 'Customer name', value: 'CUSTOMER_NAME' },
          { label: 'Total price', value: 'TOTAL_PRICE' },
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
      abandonedCheckouts: GqlConnection<GqlAbandonedCheckout>;
    }>({
      auth,
      query: `query ListAbandonedCheckouts($first: Int!, $after: String, $query: String, $sortKey: AbandonedCheckoutSortKeys, $reverse: Boolean) { abandonedCheckouts(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) { nodes { ${shopifyFields.ABANDONED_CHECKOUT_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        query: shopifyValues.nonEmpty(propsValue.query),
        sortKey: propsValue.sort_key,
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.abandonedCheckouts,
      map: shopifyMappers.mapAbandonedCheckout,
      redactedFields,
    });
  },
});
