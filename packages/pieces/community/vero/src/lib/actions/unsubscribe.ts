import { createAction, Property } from '@activepieces/pieces-framework';
import { veroAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const unsubscribe = createAction({
  auth: veroAuth,
  name: 'unsubscribe',
  displayName: 'Unsubscribe',
  description: 'Globally unsubscribe a user from all communications',
  props: {
    id: Property.ShortText({
      displayName: 'User ID',
      description: 'The unique identifier of the user',
      required: true,
    }),
  },
  async run(context) {
    const { id } = context.propsValue;

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/users/unsubscribe',
      {
        id,
      }
    );

    return response;
  },
});
