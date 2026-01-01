import { createAction, Property } from '@activepieces/pieces-framework';
import { veroAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const deleteUser = createAction({
  auth: veroAuth,
  name: 'deleteUser',
  displayName: 'Delete User',
  description: 'Delete a user and all their properties and activities permanently. This action is irreversible.',
  props: {
    id: Property.ShortText({
      displayName: 'User ID',
      description: 'The unique identifier of the user to delete',
      required: true,
    }),
  },
  async run(context) {
    const { id } = context.propsValue;

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/users/delete',
      {
        id,
      }
    );

    return response;
  },
});
