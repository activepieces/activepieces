import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlOrder,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';

export const shopifyAiUnarchiveOrder = createAction({
  auth: shopifyAuth,
  name: 'unarchive_order',
  classification: 'WRITE',
  displayName: 'Unarchive Order',
  description: 'Reopen a closed (archived) order.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reopens an order that was closed with archive_order so it shows as open again. It does not restore a cancelled order. Reopening an open order leaves it open, so repeating is safe.',
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
      orderOpen: { order: GqlOrder | null } | null;
    }>({
      auth,
      query: `mutation UnarchiveOrder($input: OrderOpenInput!) { orderOpen(input: $input) { order { ${shopifyFields.ORDER_SUMMARY_FIELDS} } userErrors { field message } } }`,
      primaryPaths: ['orderOpen.order'],
      variables: { input: { id } },
    });
    const order = data.orderOpen?.order;
    if (!order) {
      throw new Error(`Order ${id} was not returned by Shopify.`);
    }
    return {
      ...shopifyMappers.mapOrderSummary(order),
      redacted_fields: redactedFields,
    };
  },
});
