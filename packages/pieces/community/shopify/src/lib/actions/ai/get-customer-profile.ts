import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlCustomer,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';

export const shopifyAiGetCustomerProfile = createAction({
  auth: shopifyAuth,
  name: 'get_customer_profile',
  classification: 'READ',
  displayName: 'Get Customer',
  description: 'Get one customer with contact details, marketing state and default address.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one customer by id: name, email and its marketing state, phone, tags, note, account state, order count, amount spent and default address. Use search_customers to find a customer by email, name or phone first. Name, email, phone and address may be null on stores without protected customer data access; such fields are listed in redacted_fields.',
    idempotent: true,
  },
  props: {
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description:
        'The customer id, numeric such as "207119551" or "gid://shopify/Customer/207119551". Find it with search_customers.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Customer', id: propsValue.customer_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      customer: GqlCustomer | null;
    }>({
      auth,
      query: `query GetCustomerProfile($id: ID!) { customer(id: $id) { ${shopifyFields.CUSTOMER_FIELDS} } }`,
      variables: { id },
    });
    if (!data.customer) {
      throw new Error(`Customer ${id} was not found.`);
    }
    return {
      ...shopifyMappers.mapCustomer(data.customer),
      redacted_fields: redactedFields,
    };
  },
});
