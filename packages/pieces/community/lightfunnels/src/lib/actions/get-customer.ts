import { createAction, Property } from '@activepieces/pieces-framework';
import { lightfunnelsAuth } from '../auth';
import { lightfunnelsCommon } from '../common/index';

export const getCustomer = createAction({
  auth: lightfunnelsAuth,
  name: 'get_customer',
  displayName: 'Get Customer',
  description: 'Retrieve a specific customer by ID',
  audience: 'both',
  aiMetadata: { description: 'Fetches a single Lightfunnels customer by its node ID, including contact details, location, order count, and expenses. Use when you have a customer ID and need their record; use List Customers first if you only have other criteria. Read-only and idempotent.', idempotent: true },
  props: {
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      description: 'The ID of the customer to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const { customerId } = context.propsValue;

    const graphqlQuery = `
      query CustomerQuery($id: ID!) {
        node(id: $id) {
          ... on Customer {
            id
            _id
            first_name
            last_name
            full_name
            email
            phone
            avatar
            location
            expenses
            orders_count
            created_at
            updated_at
          }
        }
      }
    `;

    const response = await lightfunnelsCommon.makeGraphQLRequest(
      context.auth,
      graphqlQuery,
      { id: customerId }
    );

    return response.data.node;
  },
});
