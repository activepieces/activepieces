import { createAction, Property } from '@activepieces/pieces-framework';
import { lightfunnelsAuth } from '../../index';
import { lightfunnelsCommon } from '../common/index';

export const createCustomer = createAction({
  auth: lightfunnelsAuth,
  name: 'create_customer',
  displayName: 'Create Customer',
  description: 'Create a new customer',
  props: {
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'First name of the customer',
      required: true,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name of the customer',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email of the customer',
      required: true,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Phone number of the customer',
      required: false,
    }),
  },
  async run(context) {
    const { firstName, lastName, email, phone } = context.propsValue;

    const graphqlQuery = `
      mutation createCustomerMutation($node: InputCustomer!) {
        createCustomer(node: $node) {
          id
          _id
          first_name
          last_name
          full_name
          email
          phone
          created_at
          updated_at
        }
      }
    `;

    const variables = {
      node: {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
      },
    };

    const response = await lightfunnelsCommon.makeGraphQLRequest(
      context.auth,
      graphqlQuery,
      variables
    );

    return response.data.createCustomer;
  },
});
