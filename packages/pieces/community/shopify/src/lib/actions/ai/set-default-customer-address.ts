import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlMailingAddress,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';
import { customerAddressOutputSchema } from '../../output-schemas/orders';

export const shopifyAiSetDefaultCustomerAddress = createAction({
  auth: shopifyAuth,
  name: 'set_default_customer_address',
  classification: 'WRITE',
  displayName: 'Set Default Customer Address',
  description: "Make one of a customer's saved addresses the default.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Makes one saved address the customer's default address. Find the address id with list_customer_addresses. Setting the address that is already the default changes nothing, so repeating is safe.",
    idempotent: true,
  },
  outputSchema: customerAddressOutputSchema,
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
      customerUpdateDefaultAddress: {
        customer: { id: string; defaultAddress?: GqlMailingAddress | null } | null;
      } | null;
    }>({
      auth,
      query: `mutation SetDefaultCustomerAddress($customerId: ID!, $addressId: ID!) { customerUpdateDefaultAddress(customerId: $customerId, addressId: $addressId) { customer { id defaultAddress { ${shopifyFields.ADDRESS_FIELDS} } } userErrors { field message } } }`,
      primaryPaths: ['customerUpdateDefaultAddress.customer', 'customerUpdateDefaultAddress.customer.defaultAddress'],
      variables: { customerId, addressId },
    });
    const customer = data.customerUpdateDefaultAddress?.customer;
    if (!customer) {
      throw new Error(`Customer ${customerId} was not returned by Shopify.`);
    }
    return {
      customer_id: customer.id,
      ...shopifyMappers.mapAddress(customer.defaultAddress),
      redacted_fields: redactedFields,
    };
  },
});
