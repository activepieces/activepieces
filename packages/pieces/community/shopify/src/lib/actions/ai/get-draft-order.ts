import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlDraftOrder,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';
import { draftOrderOutputSchema } from '../../output-schemas/orders';

export const shopifyAiGetDraftOrder = createAction({
  auth: shopifyAuth,
  name: 'get_draft_order',
  classification: 'READ',
  displayName: 'Get Draft Order',
  description: 'Get one draft order with its line items and totals.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one draft order by id: status, invoice URL, totals, customer, payment terms, the first 100 line items and, once completed, the resulting order id. Use list_draft_orders to find a draft first. Read-only.',
    idempotent: true,
  },
  outputSchema: draftOrderOutputSchema,
  props: {
    draft_order_id: Property.ShortText({
      displayName: 'Draft Order ID',
      description: 'The draft order id, numeric or "gid://shopify/DraftOrder/…". Find it with list_draft_orders.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'DraftOrder', id: propsValue.draft_order_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      draftOrder: GqlDraftOrder | null;
    }>({
      auth,
      query: `query GetDraftOrder($id: ID!) { draftOrder(id: $id) { ${shopifyFields.DRAFT_ORDER_DETAIL_FIELDS} } }`,
      variables: { id },
    });
    if (!data.draftOrder) {
      throw new Error(`Draft order ${id} was not found.`);
    }
    return {
      ...shopifyMappers.mapDraftOrderDetail(data.draftOrder),
      redacted_fields: redactedFields,
    };
  },
});
