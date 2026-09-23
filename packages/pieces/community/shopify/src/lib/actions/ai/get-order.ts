import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlOrder,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';

export const shopifyAiGetOrder = createAction({
  auth: shopifyAuth,
  name: 'get_order',
  classification: 'READ',
  displayName: 'Get Order',
  description: 'Get one order with its totals, addresses and line items.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one order by id: status, money totals, customer, shipping and billing address, the first 100 line items, and the fulfillment and transaction counts. Use search_orders to find an order by name, email or date first. Customer contact fields may be null on stores without protected customer data access; such fields are listed in redacted_fields.',
    idempotent: true,
  },
  props: {
    order_id: Property.ShortText({
      displayName: 'Order ID',
      description:
        'The order id: a numeric id such as "450789469" or a full id such as "gid://shopify/Order/450789469". Find it with search_orders.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Order', id: propsValue.order_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      order: GqlOrder | null;
    }>({
      auth,
      query: `query GetOrder($id: ID!) { order(id: $id) { ${shopifyFields.ORDER_DETAIL_FIELDS} } }`,
      variables: { id },
    });
    if (!data.order) {
      throw new Error(`Order ${id} was not found.`);
    }
    return {
      ...shopifyMappers.mapOrderDetail(data.order),
      redacted_fields: redactedFields,
    };
  },
});
