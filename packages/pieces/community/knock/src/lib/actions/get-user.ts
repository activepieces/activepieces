import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { knockAuth } from '../auth';
import { knockApiCall } from '../common/client';

export const getUser = createAction({
  auth: knockAuth,
  name: 'get_user',
  displayName: 'Get User',
  description: 'Retrieve a user from Knock by their ID.',
  props: {
    userId: Property.ShortText({
      displayName: 'User ID',
      description: 'The unique identifier of the user to retrieve.',
      required: true,
    }),
  },
  async run(context) {
    return knockApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/users/${encodeURIComponent(context.propsValue.userId)}`,
    });
  },
});
