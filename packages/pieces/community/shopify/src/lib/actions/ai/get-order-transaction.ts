import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlTransaction,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';

export const shopifyAiGetOrderTransaction = createAction({
  auth: shopifyAuth,
  name: 'get_order_transaction',
  classification: 'READ',
  displayName: 'Get Order Transaction',
  description: 'Get one payment transaction by id.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one order transaction by its id: kind, status, amount, gateway, capturable state, parent transaction and the order it belongs to. Use list_order_transactions when you only know the order. Read-only.',
    idempotent: true,
  },
  props: {
    transaction_id: Property.ShortText({
      displayName: 'Transaction ID',
      description:
        'The transaction id, numeric such as "389404469" or "gid://shopify/OrderTransaction/389404469". Find it with list_order_transactions.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'OrderTransaction', id: propsValue.transaction_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      node: GqlTransaction | null;
    }>({
      auth,
      query: `query GetOrderTransaction($id: ID!) { node(id: $id) { id ... on OrderTransaction { ${shopifyFields.TRANSACTION_FIELDS} } } }`,
      variables: { id },
    });
    if (!data.node) {
      throw new Error(`Transaction ${id} was not found.`);
    }
    return {
      ...shopifyMappers.mapTransaction(data.node),
      redacted_fields: redactedFields,
    };
  },
});
