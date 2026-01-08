import { createAction, Property } from '@activepieces/pieces-framework';
import { waitwhileAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createACustomer = createAction({
  auth: waitwhileAuth,
  name: 'createACustomer',
  displayName: 'Create a customer',
  description: 'Create a new customer in Waitwhile',
  props: {
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'Customer first name',
      required: true,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Customer last name',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Customer phone number',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Customer email address',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags associated with the customer',
      required: false,
    }),
  },
  async run(context) {
    const { firstName, lastName, phone, email, tags } = context.propsValue;
    const api_key = context.auth.secret_text;

    const body: any = {
      firstName,
    };
    if (lastName) {
      body['lastName'] = lastName;
    }
    if (phone) {
      body['phone'] = phone;
    }
    if (email) {
      body['email'] = email;
    }
    if (tags) {
      body['tags'] = tags;
    }

    const response = await makeRequest(
      api_key,
      HttpMethod.POST,
      '/customers',
      body
    );
    return response;
  },
});
