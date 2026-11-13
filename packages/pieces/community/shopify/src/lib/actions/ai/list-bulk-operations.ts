import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlBulkOperation,
  GqlConnection,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

const MAX_PAGE_SIZE = 250;
import { listBulkOperationsOutputSchema } from '../../output-schemas/store';

export const shopifyAiListBulkOperations = createAction({
  auth: shopifyAuth,
  name: 'list_bulk_operations',
  classification: 'SEARCH',
  displayName: 'List Bulk Operations',
  description: 'List this app\'s bulk queries and bulk mutations, newest first.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the bulk operations this app token started (bulk queries and bulk mutations), newest first by default, with status, type, counts and result URLs. Use status RUNNING to see what is still in progress before starting another one (up to five of each type can run per shop at the same time from API version 2026-01). Optional filters: status, type, and extra Shopify search syntax such as "created_at:>2026-09-01". Paged: pass end_cursor back as the cursor while has_next_page is true. Read-only.',
    idempotent: true,
  },
  props: {
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Only operations in this state.',
      required: false,
      options: {
        options: [
          { label: 'Created', value: 'created' },
          { label: 'Running', value: 'running' },
          { label: 'Completed', value: 'completed' },
          { label: 'Failed', value: 'failed' },
          { label: 'Canceling', value: 'canceling' },
          { label: 'Canceled', value: 'canceled' },
        ],
      },
    }),
    operation_type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'Only bulk queries or only bulk mutations.',
      required: false,
      options: {
        options: [
          { label: 'Query', value: 'query' },
          { label: 'Mutation', value: 'mutation' },
        ],
      },
    }),
    query: shopifyProps.searchQuery(
      'Extra Shopify search syntax, for example "created_at:>2026-09-01". Leave empty for no extra filter.'
    ),
    sort_key: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort by. Defaults to the creation time.',
      required: false,
      options: {
        options: [
          { label: 'Created at', value: 'CREATED_AT' },
          { label: 'Completed at', value: 'COMPLETED_AT' },
        ],
      },
    }),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  outputSchema: listBulkOperationsOutputSchema,
  async run({ auth, propsValue }) {
    const query = shopifyValues.joinSearch([
      propsValue.status ? `status:${propsValue.status}` : undefined,
      propsValue.operation_type ? `operation_type:${propsValue.operation_type}` : undefined,
      shopifyValues.nonEmpty(propsValue.query),
    ]);
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      bulkOperations: GqlConnection<GqlBulkOperation>;
    }>({
      auth,
      query: `query ListBulkOperations($first: Int!, $after: String, $query: String, $sortKey: BulkOperationsSortKeys, $reverse: Boolean) { bulkOperations(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) { nodes { ${shopifyFields.BULK_OPERATION_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        query,
        sortKey: propsValue.sort_key,
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.bulkOperations,
      map: shopifyMappers.mapBulkOperation,
      redactedFields,
    });
  },
});
