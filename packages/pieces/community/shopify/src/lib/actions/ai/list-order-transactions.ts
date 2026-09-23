import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlTransaction,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';

export const shopifyAiListOrderTransactions = createAction({
  auth: shopifyAuth,
  name: 'list_order_transactions',
  classification: 'SEARCH',
  displayName: 'List Order Transactions',
  description: 'List every payment transaction on an order.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists all payment transactions of one order (authorizations, captures, sales, refunds, voids) with amount, status, gateway and parent transaction. Use it to find the authorization id for capture_order_payment or void_order_transaction, or the parent id and gateway for create_refund. Returns up to 100 transactions in one call (no paging); truncated=true means the order may have more. Read-only.',
    idempotent: true,
  },
  props: {
    order_id: Property.ShortText({
      displayName: 'Order ID',
      description: 'The order id, numeric or "gid://shopify/Order/…". Find it with search_orders.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Order', id: propsValue.order_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      order: { id: string; transactions?: GqlTransaction[] | null } | null;
    }>({
      auth,
      query: `query ListOrderTransactions($id: ID!) { order(id: $id) { id transactions(first: ${TRANSACTION_LIMIT}) { ${shopifyFields.TRANSACTION_FIELDS} } } }`,
      variables: { id },
      primaryPaths: ['order.transactions'],
    });
    if (!data.order) {
      throw new Error(`Order ${id} was not found.`);
    }
    const items = (data.order.transactions ?? []).map(shopifyMappers.mapTransaction);
    return {
      order_id: data.order.id,
      items,
      count: items.length,
      truncated: items.length === TRANSACTION_LIMIT,
      redacted_fields: redactedFields,
    };
  },
});

const TRANSACTION_LIMIT = 100;
