import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlBulkOperation,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';
import { bulkOperationOutputSchema } from '../../output-schemas/store';

export const shopifyAiGetBulkOperation = createAction({
  auth: shopifyAuth,
  name: 'get_bulk_operation',
  classification: 'READ',
  displayName: 'Get Bulk Operation',
  description: 'Check the status and result file of a bulk query or bulk mutation.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one bulk operation (started by start_bulk_query or start_bulk_mutation): its status (CREATED, RUNNING, CANCELING, CANCELED, COMPLETED, FAILED, EXPIRED), type, error code, object counts and, once COMPLETED, the url of the JSONL result file (partial_data_url holds what was produced before a failure). This is a single read, not a wait: call it again later while status is CREATED or RUNNING. Result links expire after seven days. Read-only.',
    idempotent: true,
  },
  props: {
    bulk_operation_id: Property.ShortText({
      displayName: 'Bulk Operation ID',
      description: 'The bulk_operation_id returned when the operation was started, numeric or "gid://shopify/BulkOperation/…".',
      required: true,
    }),
  },
  outputSchema: bulkOperationOutputSchema,
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'BulkOperation', id: propsValue.bulk_operation_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      bulkOperation: GqlBulkOperation | null;
    }>({
      auth,
      query: `query GetBulkOperation($id: ID!) { bulkOperation(id: $id) { ${shopifyFields.BULK_OPERATION_FIELDS} } }`,
      variables: { id },
    });
    if (!data.bulkOperation) {
      throw new Error(`Bulk operation ${id} was not found.`);
    }
    return {
      ...shopifyMappers.mapBulkOperation(data.bulkOperation),
      redacted_fields: redactedFields,
    };
  },
});
