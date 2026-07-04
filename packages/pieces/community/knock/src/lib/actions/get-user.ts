import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { knockAuth } from '../auth';
import { knockApiCall } from '../common/client';

export const getUser = createAction({
  auth: knockAuth,
  name: 'get_user',
  displayName: 'Get User',
  description: 'Retrieve a user from Knock by their ID.',
  audience: 'both',
  aiMetadata: {
    description: 'Fetches a single Knock user record by its unique user ID. Choose this to look up an existing recipient profile. Read-only and idempotent.',
    idempotent: true,
  },
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
