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
      description: 'Phone number of the customer eg: +1234567890',
      required: true,
    }),
    acceptsMarketing: Property.Checkbox({
      displayName: 'Accepts Marketing',
      description: 'Whether the customer accepts marketing communications',
      required: true,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to associate with the customer',
      required: true,
      properties: {
        tag: Property.ShortText({
          displayName: 'Tag',
          required: true,
        }),
      },
    }),
  },
  async run(context) {
    const { firstName, lastName, email, phone, acceptsMarketing, tags } = context.propsValue;

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
          accepts_marketing
          tags
          created_at
          updated_at
        }
      }
    `;

    const tagArray = (tags || []).map((t: any) => t.tag);

    const variables = {
      node: {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        accepts_marketing: acceptsMarketing,
        tags: tagArray,
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
