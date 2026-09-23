import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient } from '../../common/graphql';

export const shopifyAiDeleteOrder = createAction({
  auth: shopifyAuth,
  name: 'delete_order',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Order',
  description: 'Permanently delete an archived or cancelled order.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one order. Shopify only allows it for orders that are archived or cancelled and were not paid through an online gateway, POS or gift card; otherwise it refuses. Prefer archive_order or start_order_cancellation to keep records. Cannot be undone; a repeat call fails because the order is gone.',
    idempotent: false,
  },
  props: {
    order_id: Property.ShortText({
      displayName: 'Order ID',
      description: 'The order id, numeric or "gid://shopify/Order/…". Find it with search_orders.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const orderId = shopifyGraphqlClient.toGid({ type: 'Order', id: propsValue.order_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      orderDelete: { deletedId?: string | null } | null;
    }>({
      auth,
      query: `mutation DeleteOrder($orderId: ID!) { orderDelete(orderId: $orderId) { deletedId userErrors { field message code } } }`,
      variables: { orderId },
    });
    return {
      deleted_id: data.orderDelete?.deletedId ?? orderId,
      redacted_fields: redactedFields,
    };
  },
});
