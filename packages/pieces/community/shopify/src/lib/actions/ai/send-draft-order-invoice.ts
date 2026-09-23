import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlDraftOrder,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiSendDraftOrderInvoice = createAction({
  auth: shopifyAuth,
  name: 'send_draft_order_invoice',
  classification: 'WRITE',
  displayName: 'Send Draft Order Invoice',
  description: 'Email the checkout invoice of a draft order to the customer.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sends an email with the draft order invoice and its checkout link so the customer can pay; the draft status becomes invoice sent. Goes to the draft email unless a recipient is given. Each call sends another email, so do not repeat it.',
    idempotent: false,
  },
  props: {
    draft_order_id: Property.ShortText({
      displayName: 'Draft Order ID',
      description: 'The draft order id, numeric or "gid://shopify/DraftOrder/…". Find it with list_draft_orders.',
      required: true,
    }),
    to: Property.ShortText({
      displayName: 'Recipient Email',
      description: 'Send to this address instead of the draft email, for example "jane@example.com".',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Email subject. Leave empty for the store default.',
      required: false,
    }),
    custom_message: Property.LongText({
      displayName: 'Custom Message',
      description: 'A personal message added to the invoice email.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'DraftOrder', id: propsValue.draft_order_id });
    const email = shopifyValues.compact({
      to: shopifyValues.nonEmpty(propsValue.to),
      subject: shopifyValues.nonEmpty(propsValue.subject),
      customMessage: shopifyValues.nonEmpty(propsValue.custom_message),
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      draftOrderInvoiceSend: { draftOrder: GqlDraftOrder | null } | null;
    }>({
      auth,
      query: `mutation SendDraftOrderInvoice($id: ID!, $email: EmailInput) { draftOrderInvoiceSend(id: $id, email: $email) { draftOrder { ${shopifyFields.DRAFT_ORDER_SUMMARY_FIELDS} } userErrors { field message } } }`,
      variables: shopifyValues.compact({
        id,
        email: Object.keys(email).length > 0 ? email : undefined,
      }),
    });
    const draft = data.draftOrderInvoiceSend?.draftOrder;
    if (!draft) {
      throw new Error(`Draft order ${id} was not returned by Shopify.`);
    }
    return {
      ...shopifyMappers.mapDraftOrderSummary(draft),
      redacted_fields: redactedFields,
    };
  },
});
