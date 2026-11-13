import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostGetUserStatusesOutputSchema } from '../../../output-schemas';

export const getUserStatusesAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_user_statuses',
  outputSchema: mattermostGetUserStatusesOutputSchema,
  displayName: 'Get User Statuses',
  description: 'Gets the presence status of several users.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns the presence (online, away, dnd or offline) of several users in one call. For one user use Get User Status. User IDs come from List Users, Search Users or Get User By Username.',
    idempotent: true,
  },
  props: {
    userIds: Property.Array({
      displayName: 'User IDs',
      description: 'User IDs (26 characters each).',
      required: true,
    }),
  },
  async run(context) {
    const statuses = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/users/status/ids',
      body: context.propsValue.userIds,
    });
    return { statuses, count: statuses.length };
  },
});
