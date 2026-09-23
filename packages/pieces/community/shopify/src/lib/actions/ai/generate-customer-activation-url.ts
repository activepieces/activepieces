import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient } from '../../common/graphql';

export const shopifyAiGenerateCustomerActivationUrl = createAction({
  auth: shopifyAuth,
  name: 'generate_customer_activation_url',
  classification: 'WRITE',
  displayName: 'Generate Customer Activation URL',
  description: 'Create a one-time account activation link for a customer.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Generates a one-time URL the customer opens to activate a classic customer account and set a password; nothing is emailed (use send_customer_account_invite to email an invite instead). Each call invalidates any earlier activation URL for that customer, so do not repeat it after sharing a link. Only for customers whose account is not yet enabled.',
    idempotent: false,
  },
  props: {
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'The customer id, numeric or "gid://shopify/Customer/…". Find it with search_customers.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const customerId = shopifyGraphqlClient.toGid({ type: 'Customer', id: propsValue.customer_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      customerGenerateAccountActivationUrl: { accountActivationUrl?: string | null } | null;
    }>({
      auth,
      query: `mutation GenerateCustomerActivationUrl($customerId: ID!) { customerGenerateAccountActivationUrl(customerId: $customerId) { accountActivationUrl userErrors { field message } } }`,
      variables: { customerId },
    });
    return {
      customer_id: customerId,
      account_activation_url: data.customerGenerateAccountActivationUrl?.accountActivationUrl ?? null,
      redacted_fields: redactedFields,
    };
  },
});
