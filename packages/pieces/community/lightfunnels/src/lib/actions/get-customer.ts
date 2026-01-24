import { createAction, Property } from '@activepieces/pieces-framework';
import { lightfunnelsAuth } from '../../index';
import { lightfunnelsCommon } from '../common/index';

export const getCustomer = createAction({
  auth: lightfunnelsAuth,
  name: 'get_customer',
  displayName: 'Get Customer',
  description: 'Retrieve a specific customer by ID',
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
