import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient, shopifyValues } from '../../common/graphql';
import { sendPaymentMethodUpdateEmailOutputSchema } from '../../output-schemas/requested-order-edits';

export const shopifyAiSendPaymentMethodUpdateEmail = createAction({
  auth: shopifyAuth,
  name: 'send_payment_method_update_email',
  classification: 'WRITE',
  displayName: 'Send Payment Method Update Email',
  description:
    'Email a customer a secure link to add a new payment method for an order, draft order or subscription contract.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Emails the customer of one order, draft order or subscription contract a secure link to add a new payment method (for example a credit card) for that resource, such as after a payment method was revoked or a subscription needs payment details. Pick resource_type and pass the matching id: an order id from search_orders, a draft order id from list_draft_orders, or a subscription contract id from the subscription app. Only the sender address and bcc recipients can be set; subject and body are Shopify\'s. Returns the customer id, which may be null with the path in redacted_fields on stores without protected customer data access (the email is still sent). Needs the write_customers access scope plus read access to the resource (read_orders, read_draft_orders or read_own_subscription_contracts). Not idempotent: each call sends another email, so do not repeat it after a success.',
    idempotent: false,
  },
  outputSchema: sendPaymentMethodUpdateEmailOutputSchema,
  props: {
    resource_type: Property.StaticDropdown({
      displayName: 'Resource Type',
      description: 'What the new payment method is for.',
      required: true,
      options: {
        options: [
          { label: 'Order', value: 'ORDERS' },
          { label: 'Draft order', value: 'DRAFT_ORDERS' },
          { label: 'Subscription contract', value: 'SUBSCRIPTIONS' },
        ],
      },
    }),
    resource_id: Property.ShortText({
      displayName: 'Resource ID',
      description:
        'The id of the order, draft order or subscription contract, numeric or a full id such as "gid://shopify/Order/450789469", "gid://shopify/DraftOrder/…" or "gid://shopify/SubscriptionContract/…". It must match the resource type; Shopify receives the number.',
      required: true,
    }),
    from: Property.ShortText({
      displayName: 'Sender Email',
      description: 'Send from this address instead of the store default, for example "support@example.com".',
      required: false,
    }),
    bcc: Property.Array({
      displayName: 'BCC Recipients',
      description: 'Email addresses that receive a blind copy, for example ["owner@example.com"].',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const resourceType = propsValue.resource_type;
    const resourceId = toMandateResourceId({ resourceType, value: propsValue.resource_id });
    const bcc = shopifyValues.readStringList(propsValue.bcc) ?? [];
    const email = shopifyValues.compact({
      from: shopifyValues.nonEmpty(propsValue.from),
      bcc: bcc.length > 0 ? bcc : undefined,
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      paymentInstrumentSendAddEmail: { customer: { id: string } | null } | null;
    }>({
      auth,
      query: `mutation SendPaymentMethodUpdateEmail($mandate: PaymentInstrumentMandateInput!, $email: EmailInput) { paymentInstrumentSendAddEmail(mandate: $mandate, email: $email) { customer { id } userErrors { field message } } }`,
      variables: shopifyValues.compact({
        mandate: { resourceType, resourceId },
        email: Object.keys(email).length > 0 ? email : undefined,
      }),
    });
    return {
      customer_id: data.paymentInstrumentSendAddEmail?.customer?.id ?? null,
      resource_type: resourceType,
      resource_id: resourceId,
      redacted_fields: redactedFields,
    };
  },
});

function toMandateResourceId({ resourceType, value }: { resourceType: string; value: string }): string {
  const gidType = MANDATE_GID_TYPES[resourceType];
  if (!gidType) {
    throw new Error(`Unknown resource type "${resourceType}". Use ORDERS, DRAFT_ORDERS or SUBSCRIPTIONS. Nothing was sent.`);
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error('Provide the resource id. Nothing was sent.');
  }
  const gid = shopifyGraphqlClient.toGid({ type: gidType, id: trimmed });
  const match = gid.match(/^gid:\/\/shopify\/([A-Za-z]+)\/\d+$/);
  if (!match) {
    throw new Error(
      `Resource id "${trimmed}" is not a numeric id or a full id such as "gid://shopify/${gidType}/123". Nothing was sent.`
    );
  }
  if (match[1] !== gidType) {
    throw new Error(
      `Resource id "${trimmed}" is ${/^[AEIOU]/.test(match[1]) ? 'an' : 'a'} ${match[1]} id, but resource type ${resourceType} needs a ${gidType} id. Nothing was sent.`
    );
  }
  return gid.slice(gid.lastIndexOf('/') + 1);
}

const MANDATE_GID_TYPES: Record<string, string> = {
  ORDERS: 'Order',
  DRAFT_ORDERS: 'DraftOrder',
  SUBSCRIPTIONS: 'SubscriptionContract',
};
