import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient } from '../../common/graphql';
import { deleteCustomerAddressOutputSchema } from '../../output-schemas/orders';

export const shopifyAiDeleteCustomerAddress = createAction({
  auth: shopifyAuth,
  name: 'delete_customer_address',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Customer Address',
  description: 'Delete a saved address from a customer.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one saved address of a customer. Find the address id with list_customer_addresses. Cannot be undone; a repeat call fails because the address is gone.',
    idempotent: false,
  },
  outputSchema: deleteCustomerAddressOutputSchema,
  props: {
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'The customer id, numeric or "gid://shopify/Customer/…".',
      required: true,
    }),
    address_id: Property.ShortText({
      displayName: 'Address ID',
      description:
        'The address id from list_customer_addresses, for example "gid://shopify/MailingAddress/1053318585?model_name=CustomerAddress" or its number.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const customerId = shopifyGraphqlClient.toGid({ type: 'Customer', id: propsValue.customer_id });
    const addressId = shopifyGraphqlClient.toGid({
      type: 'MailingAddress',
      id: propsValue.address_id,
      query: 'model_name=CustomerAddress',
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      customerAddressDelete: { deletedAddressId?: string | null } | null;
    }>({
      auth,
      query: `mutation DeleteCustomerAddress($customerId: ID!, $addressId: ID!) { customerAddressDelete(customerId: $customerId, addressId: $addressId) { deletedAddressId userErrors { field message } } }`,
      variables: { customerId, addressId },
    });
    return {
      customer_id: customerId,
      deleted_address_id: data.customerAddressDelete?.deletedAddressId ?? addressId,
      redacted_fields: redactedFields,
    };
  },
});
