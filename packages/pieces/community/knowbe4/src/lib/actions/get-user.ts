import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { knowbe4Auth } from '../auth';
import { knowbe4ApiRequest } from '../common';

export const getUser = createAction({
  auth: knowbe4Auth,
  name: 'get_user',
  displayName: 'Get User',
  description: 'Get details of a specific user by their ID',
  props: {
    userId: Property.Number({
      displayName: 'User ID',
      description: 'The ID of the user to retrieve',
      required: true,
    }),
  },
  async run(context) {
    return await knowbe4ApiRequest({
      auth: context.auth,
      method: HttpMethod.GET,
      endpoint: `/users/${context.propsValue.userId}`,
    });
  },
});
