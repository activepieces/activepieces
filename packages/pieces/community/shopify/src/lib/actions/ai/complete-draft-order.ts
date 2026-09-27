import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlDraftOrder,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiCompleteDraftOrder = createAction({
  auth: shopifyAuth,
  name: 'complete_draft_order',
  classification: 'WRITE',
  displayName: 'Complete Draft Order',
  description: 'Turn a draft order into a real order.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Converts a draft order into a real order and reserves its inventory; the new order id is returned in order_id. To leave the order payment-pending, set payment terms on the draft first with update_draft_order; without payment terms Shopify records the order as paid. A payment gateway id only chooses the gateway the payment is recorded against; it does not keep the order unpaid. Completing twice fails, so do not repeat it.',
    idempotent: false,
  },
  props: {
    draft_order_id: Property.ShortText({
      displayName: 'Draft Order ID',
      description: 'The draft order id, numeric or "gid://shopify/DraftOrder/…". Find it with list_draft_orders.',
      required: true,
    }),
    payment_gateway_id: Property.ShortText({
      displayName: 'Payment Gateway ID',
      description:
        'Optional manual payment gateway to record the payment against, as a full id such as "gid://shopify/PaymentGateway/1".',
      required: false,
    }),
    source_name: Property.ShortText({
      displayName: 'Source Name',
      description: 'Optional channel label stored on the order, for example "phone".',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'DraftOrder', id: propsValue.draft_order_id });
    const gatewayId = shopifyValues.nonEmpty(propsValue.payment_gateway_id);
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      draftOrderComplete: { draftOrder: GqlDraftOrder | null } | null;
    }>({
      auth,
      query: `mutation CompleteDraftOrder($id: ID!, $paymentGatewayId: ID, $sourceName: String) { draftOrderComplete(id: $id, paymentGatewayId: $paymentGatewayId, sourceName: $sourceName) { draftOrder { ${shopifyFields.DRAFT_ORDER_DETAIL_FIELDS} } userErrors { field message } } }`,
      primaryPaths: ['draftOrderComplete.draftOrder'],
      variables: shopifyValues.compact({
        id,
        paymentGatewayId: gatewayId
          ? shopifyGraphqlClient.toGid({ type: 'PaymentGateway', id: gatewayId })
          : undefined,
        sourceName: shopifyValues.nonEmpty(propsValue.source_name),
      }),
    });
    const draft = data.draftOrderComplete?.draftOrder;
    if (!draft) {
      throw new Error(`Draft order ${id} was not returned by Shopify.`);
    }
    return {
      ...shopifyMappers.mapDraftOrderDetail(draft),
      redacted_fields: redactedFields,
    };
  },
});
