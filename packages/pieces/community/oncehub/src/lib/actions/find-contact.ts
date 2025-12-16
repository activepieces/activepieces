import { createAction, Property } from '@activepieces/pieces-framework';
import { oncehubAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findContact = createAction({
  auth: oncehubAuth,
  name: 'findContact',
  displayName: 'Find Contact',
  description: 'Search for contacts in Oncehub by various criteria',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Filter contacts by email address',
      required: true,
    }),
  },
  async run(context) {
    const { email } = context.propsValue;

    const api_key = context.auth.secret_text;

    const params = new URLSearchParams();

    if (email) {
      params.append('email', email);
    }

    const queryString = params.toString();
    const path = `/contacts${queryString ? `?${queryString}` : ''}`;

    const response = await makeRequest(api_key, HttpMethod.GET, path);

    return response;
  },
});
