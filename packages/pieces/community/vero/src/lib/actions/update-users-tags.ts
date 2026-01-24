import { createAction, Property } from '@activepieces/pieces-framework';
import { veroAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateUsersTags = createAction({
  auth: veroAuth,
  name: 'updateUsersTags',
  displayName: 'Update User Tags',
  description: 'Add or remove tags from a user profile',
  props: {
    id: Property.ShortText({
      displayName: 'User ID',
      description: 'The unique identifier of the user',
      required: true,
    }),
    add: Property.Array({
      displayName: 'Tags to Add',
      description: 'An array of tags to add to the user',
      required: false,
    }),
    remove: Property.Array({
      displayName: 'Tags to Remove',
      description: 'An array of tags to remove from the user',
      required: false,
    }),
  },
  async run(context) {
    const { id, add, remove } = context.propsValue;

    const payload: any = {
      id,
    };

    if (add && add.length > 0) {
      payload.add = add;
    }

    if (remove && remove.length > 0) {
      payload.remove = remove;
    }

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.PUT,
      '/users/tags/edit',
      payload
    );

    return response;
  },
});
