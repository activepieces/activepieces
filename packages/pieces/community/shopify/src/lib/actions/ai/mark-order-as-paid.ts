import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlOrder,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';
import { orderOutputSchema } from '../../output-schemas/orders';

export const shopifyAiMarkOrderAsPaid = createAction({
  auth: shopifyAuth,
  name: 'mark_order_as_paid',
  classification: 'WRITE',
  displayName: 'Mark Order as Paid',
  description: 'Record the outstanding balance of an order as paid manually.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes payment state: records a manual payment for the full outstanding balance of an order (for example cash, bank transfer or cheque received offline). No card is charged. Only works when the order can be marked as paid (see can_mark_as_paid on get_order); use capture_order_payment for card authorizations. Each call adds a payment record, so do not repeat it.',
    idempotent: false,
  },
  outputSchema: orderOutputSchema,
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
      orderMarkAsPaid: { order: GqlOrder | null } | null;
    }>({
      auth,
      query: `mutation MarkOrderAsPaid($input: OrderMarkAsPaidInput!) { orderMarkAsPaid(input: $input) { order { ${shopifyFields.ORDER_DETAIL_FIELDS} } userErrors { field message } } }`,
      primaryPaths: ['orderMarkAsPaid.order'],
      variables: { input: { id } },
    });
    const order = data.orderMarkAsPaid?.order;
    if (!order) {
      throw new Error(`Order ${id} was not returned by Shopify.`);
    }
    return {
      ...shopifyMappers.mapOrderDetail(order),
      redacted_fields: redactedFields,
    };
  },
});
