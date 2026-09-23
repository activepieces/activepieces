import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlBulkOperation,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';

export const shopifyAiCancelBulkOperation = createAction({
  auth: shopifyAuth,
  name: 'cancel_bulk_operation',
  classification: 'DESTRUCTIVE',
  displayName: 'Cancel Bulk Operation',
  description: 'Stop a running bulk query or bulk mutation.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Starts cancelling a running bulk operation and returns it, usually with status CANCELING; it becomes CANCELED shortly after (check with get_bulk_operation). A cancelled bulk query produces no complete result file (partial_data_url may hold what was read), and a cancelled bulk mutation keeps every line it already applied; nothing is rolled back. It cannot be resumed; start a new operation instead. Cancelling an operation that already finished is expected to fail (not yet confirmed on a store). Frees a slot when the per-shop limit of running bulk operations is reached.',
    idempotent: false,
  },
  props: {
    bulk_operation_id: Property.ShortText({
      displayName: 'Bulk Operation ID',
      description: 'The bulk operation id, numeric or "gid://shopify/BulkOperation/…". Find running ones with list_bulk_operations.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'BulkOperation', id: propsValue.bulk_operation_id });
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
