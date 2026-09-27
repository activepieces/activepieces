import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlBulkOperation,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';
import { bulkOperationOutputSchema } from '../../output-schemas/store';

export const shopifyAiCancelBulkOperation = createAction({
  auth: shopifyAuth,
  name: 'cancel_bulk_operation',
  classification: 'DESTRUCTIVE',
  displayName: 'Cancel Bulk Operation',
  description: 'Stop a running bulk query or bulk mutation.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Starts cancelling a running bulk operation and returns it, usually with status CANCELING; it becomes CANCELED shortly after (check with get_bulk_operation). A cancelled bulk query produces no complete result file (partial_data_url may hold what was read), and a cancelled bulk mutation keeps every line it already applied; nothing is rolled back. It cannot be resumed; start a new operation instead. Cancelling an operation that already finished fails with "A bulk operation cannot be canceled when it is completed". Frees a slot when the per-shop limit of running bulk operations is reached.',
    idempotent: false,
  },
  props: {
    bulk_operation_id: Property.ShortText({
      displayName: 'Bulk Operation ID',
      description: 'The bulk operation id, numeric or "gid://shopify/BulkOperation/…". Find running ones with list_bulk_operations.',
      required: true,
    }),
  },
  outputSchema: bulkOperationOutputSchema,
  async run({ auth, propsValue }) {
    const rawId = shopifyValues.nonEmpty(propsValue.bulk_operation_id);
    if (rawId === undefined) {
      throw new Error('bulk_operation_id is required. Find running operations with list_bulk_operations.');
    }
    const id = shopifyGraphqlClient.toGid({ type: 'BulkOperation', id: rawId });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      bulkOperationCancel: { bulkOperation: GqlBulkOperation | null } | null;
    }>({
      auth,
      query: `mutation CancelBulkOperation($id: ID!) { bulkOperationCancel(id: $id) { bulkOperation { ${shopifyFields.BULK_OPERATION_FIELDS} } userErrors { field message } } }`,
      variables: { id },
    });
    const operation = data.bulkOperationCancel?.bulkOperation;
    if (!operation) {
      throw new Error('Shopify did not return the bulk operation.');
    }
    return {
      ...shopifyMappers.mapBulkOperation(operation),
      redacted_fields: redactedFields,
    };
  },
});
