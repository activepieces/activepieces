import { createAction, Property } from '@activepieces/pieces-framework';
import { veroAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const aliasAUser = createAction({
  auth: veroAuth,
  name: 'aliasAUser',
  displayName: 'Alias a User',
  description:
    "Change a user's identifier by merging two user identities into one",
  props: {
    id: Property.ShortText({
      displayName: 'Old User ID',
      description: 'The old unique identifier of the user',
      required: true,
    }),
    new_id: Property.ShortText({
      displayName: 'New User ID',
      description: 'The new unique identifier of the user',
      required: true,
    }),
  },
  async run(context) {
    const { id, new_id } = context.propsValue;

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.PUT,
      '/users/reidentify',
      {
        id,
        new_id,
      }
    );

    return response;
  },
});
