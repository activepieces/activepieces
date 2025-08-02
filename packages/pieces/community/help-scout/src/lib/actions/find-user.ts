import { createAction, Property } from '@activepieces/pieces-framework';
import { helpScoutAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findUser = createAction({
  auth: helpScoutAuth,
  name: 'findUser',
  displayName: 'Find User',
  description: 'Find a Help Scout user by email.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Find a user with this email address.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const email = propsValue['email'];
    const queryString = `?email=${encodeURIComponent(email)}`;
    const response = await makeRequest(auth.access_token, HttpMethod.GET, `/users${queryString}`);
    return response;
  },
});
