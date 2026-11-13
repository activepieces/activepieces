import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostGetUserByEmailOutputSchema } from '../../../output-schemas';

export const getUserByUsernameAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_user_by_username',
  outputSchema: mattermostGetUserByEmailOutputSchema,
  displayName: 'Get User By Username',
  description: 'Gets a user by username.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one user\'s profile, including the user ID other actions take, from their exact username (without "@"). To match part of a name use Search Users.',
    idempotent: true,
  },
  props: {
    username: Property.ShortText({
      displayName: 'Username',
      description: 'Exact username without "@", e.g. "john.smith".',
      required: true,
    }),
  },
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/users/username/${encodeURIComponent(context.propsValue.username)}`,
    });
  },
});
