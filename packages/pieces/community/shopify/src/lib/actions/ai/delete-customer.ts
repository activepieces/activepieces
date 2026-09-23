import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient } from '../../common/graphql';

export const shopifyAiDeleteCustomer = createAction({
  auth: shopifyAuth,
  name: 'delete_customer',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Customer',
  description: 'Permanently delete a customer who has no orders.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one customer and their addresses. Shopify refuses when the customer has any orders (check can_delete on get_customer_profile). Cannot be undone; a repeat call fails because the customer is gone.',
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
    const id = shopifyGraphqlClient.toGid({ type: 'Customer', id: propsValue.customer_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      customerDelete: { deletedCustomerId?: string | null } | null;
    }>({
      auth,
      query: `mutation DeleteCustomer($input: CustomerDeleteInput!) { customerDelete(input: $input) { deletedCustomerId userErrors { field message } } }`,
      variables: { input: { id } },
    });
    return {
      deleted_customer_id: data.customerDelete?.deletedCustomerId ?? id,
      redacted_fields: redactedFields,
    };
  },
});
