import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlTransaction,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';

export const shopifyAiVoidOrderTransaction = createAction({
  auth: shopifyAuth,
  name: 'void_order_transaction',
  classification: 'DESTRUCTIVE',
  displayName: 'Void Payment Authorization',
  description: 'Void an uncaptured payment authorization on an order.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes payment state: voids an authorization that has not been captured, releasing the hold on the customer\'s card so it can no longer be captured. Needs the AUTHORIZATION transaction id from list_order_transactions. Use create_refund instead for money that was already captured. Cannot be undone; a repeat call fails.',
    idempotent: false,
  },
  props: {
    parent_transaction_id: Property.ShortText({
      displayName: 'Authorization Transaction ID',
      description:
        'The AUTHORIZATION transaction to void, numeric or "gid://shopify/OrderTransaction/…". Find it with list_order_transactions.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const parentTransactionId = shopifyGraphqlClient.toGid({
      type: 'OrderTransaction',
      id: propsValue.parent_transaction_id,
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      transactionVoid: { transaction: GqlTransaction | null } | null;
    }>({
      auth,
      query: `mutation VoidOrderTransaction($parentTransactionId: ID!) { transactionVoid(parentTransactionId: $parentTransactionId) { transaction { ${shopifyFields.TRANSACTION_FIELDS} } userErrors { field message code } } }`,
      variables: { parentTransactionId },
    });
    const transaction = data.transactionVoid?.transaction;
    if (!transaction) {
      throw new Error('Shopify did not return the void transaction.');
    }
    return {
      ...shopifyMappers.mapTransaction(transaction),
      redacted_fields: redactedFields,
    };
  },
});
