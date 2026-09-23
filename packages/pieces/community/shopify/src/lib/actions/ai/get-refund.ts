import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlRefund,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';

export const shopifyAiGetRefund = createAction({
  auth: shopifyAuth,
  name: 'get_refund',
  classification: 'READ',
  displayName: 'Get Refund',
  description: 'Get one refund by id.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one refund by id with its amount, note, refunded line items, refund transactions and the order it belongs to. Use list_order_refunds when you only know the order. Read-only.',
    idempotent: true,
  },
  props: {
    refund_id: Property.ShortText({
      displayName: 'Refund ID',
      description: 'The refund id, numeric or "gid://shopify/Refund/…". Find it with list_order_refunds.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Refund', id: propsValue.refund_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      refund: GqlRefund | null;
    }>({
      auth,
      query: `query GetRefund($id: ID!) { refund(id: $id) { ${shopifyFields.REFUND_FIELDS} } }`,
      variables: { id },
    });
    if (!data.refund) {
      throw new Error(`Refund ${id} was not found.`);
    }
    return {
      ...shopifyMappers.mapRefund(data.refund),
      redacted_fields: redactedFields,
    };
  },
});
