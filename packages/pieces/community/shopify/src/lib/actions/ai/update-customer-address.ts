import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlMailingAddress,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiUpdateCustomerAddress = createAction({
  auth: shopifyAuth,
  name: 'update_customer_address',
  classification: 'WRITE',
  displayName: 'Update Customer Address',
  description: 'Change fields of a saved customer address.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes one saved address of a customer and can make it the default. Only the address fields you fill in are sent; with no address fields and set_as_default = Yes it only makes the address the default. Find the address id with list_customer_addresses. Re-running with the same values is safe.',
    idempotent: true,
  },
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
    ...shopifyProps.address(),
    set_as_default: shopifyProps.booleanChoice({
      displayName: 'Set as Default',
      description: "Yes makes this the customer's default address. Leave empty to leave the default unchanged.",
    }),
  },
  async run({ auth, propsValue }) {
    const address = shopifyValues.buildMailingAddress(propsValue);
    const setAsDefault = shopifyValues.toBooleanChoice(propsValue.set_as_default);
    const hasAddressFields = Object.keys(address).length > 0;
    if (!hasAddressFields && setAsDefault !== true) {
      throw new Error(
        setAsDefault === false
          ? 'Shopify cannot unset a default address on its own. Make another address the default instead (set_as_default = Yes on that address), or provide address fields to update.'
          : 'Provide at least one address field to update, or set as default.'
      );
    }
    const customerId = shopifyGraphqlClient.toGid({ type: 'Customer', id: propsValue.customer_id });
    const addressId = shopifyGraphqlClient.toGid({
      type: 'MailingAddress',
      id: propsValue.address_id,
      query: 'model_name=CustomerAddress',
    });
    if (!hasAddressFields) {
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
      const defaultAddress = data.customerUpdateDefaultAddress?.customer?.defaultAddress;
      if (!defaultAddress) {
        throw new Error(`Address ${addressId} was not returned by Shopify as the default address.`);
      }
      return {
        customer_id: customerId,
        ...shopifyMappers.mapAddress(defaultAddress),
        redacted_fields: redactedFields,
      };
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      customerAddressUpdate: { address: GqlMailingAddress | null } | null;
    }>({
      auth,
      query: `mutation UpdateCustomerAddress($customerId: ID!, $addressId: ID!, $address: MailingAddressInput!, $setAsDefault: Boolean) { customerAddressUpdate(customerId: $customerId, addressId: $addressId, address: $address, setAsDefault: $setAsDefault) { address { ${shopifyFields.ADDRESS_FIELDS} } userErrors { field message } } }`,
      primaryPaths: ['customerAddressUpdate.address'],
      variables: shopifyValues.compact({ customerId, addressId, address, setAsDefault }),
    });
    const updated = data.customerAddressUpdate?.address;
    if (!updated) {
      throw new Error(`Address ${addressId} was not returned by Shopify.`);
    }
    return {
      customer_id: customerId,
      ...shopifyMappers.mapAddress(updated),
      redacted_fields: redactedFields,
    };
  },
});
