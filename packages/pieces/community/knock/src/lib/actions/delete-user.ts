import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { knockAuth } from '../auth';
import { knockApiCall } from '../common/client';

export const deleteUser = createAction({
  auth: knockAuth,
  name: 'delete_user',
  displayName: 'Delete User',
  description: 'Delete a user from Knock by their ID.',
  audience: 'both',
  aiMetadata: {
    description: 'Permanently deletes a Knock user identified by its unique user ID. Choose this to remove a recipient from Knock. Destructive and not idempotent — the first call removes the user and a repeat call fails to find it.',
    idempotent: false,
  },
  props: {
    userId: Property.ShortText({
      displayName: 'User ID',
      description: 'The unique identifier of the user to delete.',
      required: true,
    }),
  },
  async run(context) {
    return knockApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.DELETE,
      path: `/users/${encodeURIComponent(context.propsValue.userId)}`,
    });
  },
});
