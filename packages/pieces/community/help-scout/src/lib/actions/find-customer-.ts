import { createAction, Property } from '@activepieces/pieces-framework';
import { helpScoutAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findCustomer = createAction({
  auth: helpScoutAuth,
  name: 'findCustomer',
  displayName: 'Find Customer',
  description: 'Search for a customer by email.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Search for a customer with this email address.',
      required: true,
    }),
    
  },
  async run({ auth, propsValue }) {
    const email = propsValue['email'];
    const queryString = `?query=(email:\"${encodeURIComponent(email)}\")`;
    const response = await makeRequest(auth.access_token, HttpMethod.GET, `/customers${queryString}`);
    return response;
  },
});
