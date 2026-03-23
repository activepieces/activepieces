import { createAction, Property } from '@activepieces/pieces-framework';
import { appfollowAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const addUser = createAction({
  auth: appfollowAuth,
  name: 'addUser',
  displayName: 'Add user',
  description: 'Adds a new user to the Appfollow account',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name of the user to be added',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email of the user to be added',
      required: true,
    }),
    role: Property.ShortText({
      displayName: 'Role',
      description: 'Role of the user to be added',
      required: true,
    }),
  },
  async run(context) {
    const { name, email, role } = context.propsValue;
    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      `/users/add`,
      {
        name,
        email,
        role,
      }
    );
    return response;
  },
});
