import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlMailingAddress,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

const MAX_PAGE_SIZE = 250;

export const shopifyAiListCustomerAddresses = createAction({
  auth: shopifyAuth,
  name: 'list_customer_addresses',
  classification: 'SEARCH',
  displayName: 'List Customer Addresses',
  description: 'List the saved addresses of one customer.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the saved addresses of one customer, marking the default one. Use the address id with update_customer_address, delete_customer_address or set_default_customer_address. Paged: pass end_cursor back as the cursor while has_next_page is true. Address fields may be null on stores without protected customer data access (see redacted_fields).',
    idempotent: true,
  },
  props: {
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'The customer id, numeric or "gid://shopify/Customer/…". Find it with search_customers.',
      required: true,
    }),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Customer', id: propsValue.customer_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      customer: {
        id: string;
        defaultAddress?: { id?: string | null } | null;
        addressesV2?: GqlConnection<GqlMailingAddress> | null;
      } | null;
    }>({
      auth,
      primaryPaths: ['customer.addressesV2'],
      query: `query ListCustomerAddresses($id: ID!, $first: Int!, $after: String, $reverse: Boolean) { customer(id: $id) { id defaultAddress { id } addressesV2(first: $first, after: $after, reverse: $reverse) { nodes { ${shopifyFields.ADDRESS_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } } }`,
      variables: {
        id,
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        reverse: propsValue.reverse ?? false,
      },
    });
    const customer = data.customer;
    if (!customer) {
      throw new Error(`Customer ${id} was not found.`);
    }
    const defaultId = customer.defaultAddress?.id ?? null;
    return {
      customer_id: customer.id,
      ...shopifyMappers.toPage({
        connection: customer.addressesV2,
        map: (address: GqlMailingAddress) => ({
          ...shopifyMappers.mapAddress(address),
          is_default: defaultId !== null && address.id === defaultId,
        }),
        redactedFields,
      }),
    };
  },
});
