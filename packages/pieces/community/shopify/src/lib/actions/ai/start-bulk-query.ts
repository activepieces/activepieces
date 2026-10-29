import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlBulkOperation,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';
import { startBulkQueryOutputSchema } from '../../output-schemas/store';

export const shopifyAiStartBulkQuery = createAction({
  auth: shopifyAuth,
  name: 'start_bulk_query',
  classification: 'SEARCH',
  displayName: 'Start Bulk Export Query',
  description: 'Start a background bulk query that exports a large dataset to a JSONL file.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Starts a Shopify bulk query operation that runs the given GraphQL query in the background over the whole dataset (no paging; the background run does not count against the API rate limit) and returns only the operation (bulk_operation_id and status). Poll get_bulk_operation with that id until status is COMPLETED, then download the JSONL file from its url; the file is kept for seven days. Use it for exports too large for the list actions. The query must contain at least one connection field (for example products or orders), supports up to five connections and a nesting depth of two, and is written without first/after arguments on those connections; it needs the same access scopes as running it normally. From API version 2026-01 each app can run up to five bulk queries per shop at the same time; above that Shopify refuses until one finishes (cancel one with cancel_bulk_operation). Each call starts another operation, so do not repeat it while the first one runs. Read-only for store data.',
    idempotent: false,
  },
  props: {
    query: Property.LongText({
      displayName: 'Bulk Query',
      description:
        'A GraphQL Admin query without paging arguments, for example "{ products { edges { node { id title variants { edges { node { id sku } } } } } } }".',
      required: true,
    }),
  },
  outputSchema: startBulkQueryOutputSchema,
  async run({ auth, propsValue }) {
    const query = shopifyValues.nonEmpty(propsValue.query);
    if (!query) {
      throw new Error('query is required. Nothing was started.');
    }
    if (/^\s*mutation\b/i.test(query)) {
      throw new Error('query must be a read query; use start_bulk_mutation to run a mutation in bulk. Nothing was started.');
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      bulkOperationRunQuery: { bulkOperation: GqlBulkOperation | null } | null;
    }>({
      auth,
      query: `mutation StartBulkQuery($query: String!) { bulkOperationRunQuery(query: $query) { bulkOperation { ${shopifyFields.BULK_OPERATION_FIELDS} } userErrors { field message code } } }`,
      variables: { query },
    });
    const operation = data.bulkOperationRunQuery?.bulkOperation;
    if (!operation) {
      throw new Error('Shopify did not return the bulk operation.');
    }
    return {
      bulk_operation_id: operation.id,
      ...shopifyMappers.mapBulkOperation(operation),
      redacted_fields: redactedFields,
    };
  },
});
