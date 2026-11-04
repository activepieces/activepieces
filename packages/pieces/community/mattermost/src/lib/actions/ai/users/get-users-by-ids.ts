import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostGetUsersByIdsOutputSchema } from '../../../output-schemas';

export const getUsersByIdsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_users_by_ids',
  outputSchema: mattermostGetUsersByIdsOutputSchema,
  displayName: 'Get Users By IDs',
  description: 'Gets several users by their IDs.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns the profiles of several users in one call from their IDs; unknown IDs are left out. For one user use Get User, for usernames use Get Users By Usernames.',
    idempotent: true,
  },
  props: {
    userIds: Property.Array({
      displayName: 'User IDs',
      description: 'User IDs (26 characters each), e.g. from List Users, Search Users or List Known Users.',
      required: true,
    }),
    since: Property.Number({
      displayName: 'Modified Since',
      description: 'Only return users changed after this Unix time in milliseconds.',
      required: false,
    }),
  },
  async run(context) {
    const { userIds, since } = context.propsValue;
    const users = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/users/ids',
      query: since !== undefined && since !== null ? { since: String(since) } : undefined,
      body: userIds,
    });
    return { users, count: users.length };
  },
});
