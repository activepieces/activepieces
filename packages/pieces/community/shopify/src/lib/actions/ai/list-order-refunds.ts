import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlRefund,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';

export const shopifyAiListOrderRefunds = createAction({
  auth: shopifyAuth,
  name: 'list_order_refunds',
  classification: 'SEARCH',
  displayName: 'List Order Refunds',
  description: 'List every refund made on an order.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the refunds of one order (up to 50) with the refunded amount, note and dates. Returns the list in one call (no paging); truncated=true means the order may have more than 50 refunds; use get_refund for the refunded line items and transactions of one refund. Read-only.',
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
      order: { id: string; refunds?: GqlRefund[] | null } | null;
    }>({
      auth,
      query: `query ListOrderRefunds($id: ID!) { order(id: $id) { id refunds(first: ${REFUND_LIMIT}) { ${shopifyFields.REFUND_SUMMARY_FIELDS} } } }`,
      variables: { id },
      primaryPaths: ['order.refunds'],
    });
    if (!data.order) {
      throw new Error(`Order ${id} was not found.`);
    }
    const items = (data.order.refunds ?? []).map(shopifyMappers.mapRefundSummary);
    return {
      order_id: data.order.id,
      items,
      count: items.length,
      truncated: items.length === REFUND_LIMIT,
      redacted_fields: redactedFields,
    };
  },
});

const REFUND_LIMIT = 50;
