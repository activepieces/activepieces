import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostGetUsersByIdsOutputSchema } from '../../../output-schemas';

export const getUsersByUsernamesAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_users_by_usernames',
  outputSchema: mattermostGetUsersByIdsOutputSchema,
  displayName: 'Get Users By Usernames',
  description: 'Gets several users by their usernames.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns the profiles of several users in one call from their usernames (without "@"); unknown usernames are left out. For one user use Get User By Username.',
    idempotent: true,
  },
  props: {
    usernames: Property.Array({
      displayName: 'Usernames',
      description: 'Usernames without "@", e.g. "john.smith".',
      required: true,
    }),
  },
  async run(context) {
    const users = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/users/usernames',
      body: context.propsValue.usernames,
    });
    return { users, count: users.length };
  },
});
