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
import { customerAddressOutputSchema } from '../../output-schemas/orders';

export const shopifyAiCreateCustomerAddress = createAction({
  auth: shopifyAuth,
  name: 'create_customer_address',
  classification: 'WRITE',
  displayName: 'Create Customer Address',
  description: 'Add a new address to a customer.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds a new saved address to one customer and optionally makes it the default. Use update_customer_address to change an existing address instead. Each call adds another address, so retries create duplicates.',
    idempotent: false,
  },
  outputSchema: customerAddressOutputSchema,
  props: {
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'The customer id, numeric or "gid://shopify/Customer/…". Find it with search_customers.',
      required: true,
    }),
    ...shopifyProps.address(),
    set_as_default: Property.Checkbox({
      displayName: 'Set as Default',
      description: "Make this the customer's default address. Off by default.",
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const address = shopifyValues.buildMailingAddress(propsValue);
    if (Object.keys(address).length === 0) {
      throw new Error('Provide at least one address field.');
    }
    const customerId = shopifyGraphqlClient.toGid({ type: 'Customer', id: propsValue.customer_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      customerAddressCreate: { address: GqlMailingAddress | null } | null;
    }>({
      auth,
      query: `mutation CreateCustomerAddress($customerId: ID!, $address: MailingAddressInput!, $setAsDefault: Boolean) { customerAddressCreate(customerId: $customerId, address: $address, setAsDefault: $setAsDefault) { address { ${shopifyFields.ADDRESS_FIELDS} } userErrors { field message } } }`,
      primaryPaths: ['customerAddressCreate.address'],
      variables: { customerId, address, setAsDefault: propsValue.set_as_default ?? false },
    });
    const created = data.customerAddressCreate?.address;
    if (!created) {
      throw new Error('Shopify did not return the created address.');
    }
    return {
      customer_id: customerId,
      ...shopifyMappers.mapAddress(created),
      redacted_fields: redactedFields,
    };
  },
});
