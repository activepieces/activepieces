import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient, shopifyValues } from '../../common/graphql';
import { sendCustomerAccountInviteOutputSchema } from '../../output-schemas/orders';

export const shopifyAiSendCustomerAccountInvite = createAction({
  auth: shopifyAuth,
  name: 'send_customer_account_invite',
  classification: 'WRITE',
  displayName: 'Send Customer Account Invite',
  description: 'Email a customer an invitation to create their store account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Emails one customer an invitation to activate their classic store account, optionally with a custom subject and message. Use generate_customer_activation_url to get a link without sending an email. Each call sends another email, so do not repeat it.',
    idempotent: false,
  },
  outputSchema: sendCustomerAccountInviteOutputSchema,
  props: {
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'The customer id, numeric or "gid://shopify/Customer/…". Find it with search_customers.',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Email subject. Leave empty for the store default.',
      required: false,
    }),
    custom_message: Property.LongText({
      displayName: 'Custom Message',
      description: 'A personal message added to the invitation.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const customerId = shopifyGraphqlClient.toGid({ type: 'Customer', id: propsValue.customer_id });
    const email = shopifyValues.compact({
      subject: shopifyValues.nonEmpty(propsValue.subject),
      customMessage: shopifyValues.nonEmpty(propsValue.custom_message),
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      customerSendAccountInviteEmail: {
        customer: { id: string; state?: string | null } | null;
      } | null;
    }>({
      auth,
      query: `mutation SendCustomerAccountInvite($customerId: ID!, $email: EmailInput) { customerSendAccountInviteEmail(customerId: $customerId, email: $email) { customer { id state } userErrors { field message code } } }`,
      variables: shopifyValues.compact({
        customerId,
        email: Object.keys(email).length > 0 ? email : undefined,
      }),
    });
    const customer = data.customerSendAccountInviteEmail?.customer;
    return {
      customer_id: customer?.id ?? customerId,
      state: customer?.state ?? null,
      redacted_fields: redactedFields,
    };
  },
});
