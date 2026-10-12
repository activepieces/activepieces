import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlOrder,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';
import { orderSummaryOutputSchema } from '../../output-schemas/orders';

export const shopifyAiArchiveOrder = createAction({
  auth: shopifyAuth,
  name: 'archive_order',
  classification: 'WRITE',
  displayName: 'Archive Order',
  description: 'Close (archive) an order.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Closes an order, which Shopify shows as archived; use it once an order is fully paid and fulfilled. This does not cancel or refund anything, and unarchive_order reopens it. Archiving an already archived order leaves it archived, so repeating is safe.',
    idempotent: true,
  },
  outputSchema: orderSummaryOutputSchema,
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
      orderClose: { order: GqlOrder | null } | null;
    }>({
      auth,
      query: `mutation ArchiveOrder($input: OrderCloseInput!) { orderClose(input: $input) { order { ${shopifyFields.ORDER_SUMMARY_FIELDS} } userErrors { field message } } }`,
      primaryPaths: ['orderClose.order'],
      variables: { input: { id } },
    });
    const order = data.orderClose?.order;
    if (!order) {
      throw new Error(`Order ${id} was not returned by Shopify.`);
    }
    return {
      ...shopifyMappers.mapOrderSummary(order),
      redacted_fields: redactedFields,
    };
  },
});
