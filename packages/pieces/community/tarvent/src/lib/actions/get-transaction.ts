import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { tarventCommon } from '../common';
import { tarventClient } from '../common/client';
import { tarventTransport } from '../common/transport';
import { tarventOutputSchemas } from '../output-schemas';

export const getTransaction = createAction({
  auth: tarventAuth,
  name: 'tarvent_get_transaction',
  classification: 'READ',
  displayName: 'Get Transaction',
  description: 'Gets the delivery status of a transactional email.',
  audience: 'both',
  aiMetadata: {
    description:
      'Gets the processing and engagement status of a Tarvent transactional email by the transaction ID returned from Send A Transactional Email: one record per recipient with status, error, bounce category, open and click counts. Returns found=false with no items when the ID is unknown. Read-only.',
    idempotent: true,
  },
  outputSchema: tarventOutputSchemas.transaction,
  props: {
    transactionId: Property.ShortText({ displayName: 'Transaction ID', description: 'The transaction ID from Send A Transactional Email.', required: true }),
  },
  async run(context) {
    const id = tarventCommon.requireText({ value: context.propsValue.transactionId, label: 'Transaction ID' });
    const data = await tarventTransport.graphql<{ transaction?: Record<string, unknown>[] | null }>({
      auth: context.auth.props,
      query: `query GetTransaction($id: String!) { transaction(id: $id) { ${tarventClient.fields.transaction} } }`,
      variables: { id },
    });
    const items = (data.transaction ?? []).filter((item) => item !== null);
    return { found: items.length > 0, transactionId: id, items };
  },
});
