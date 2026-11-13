import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostListKnownUsersOutputSchema } from '../../../output-schemas';

export const listKnownUsersAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_list_known_users',
  outputSchema: mattermostListKnownUsersOutputSchema,
  displayName: 'List Known Users',
  description: 'Lists the IDs of users the connected user shares a channel with.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns the IDs of every user who shares any channel (including direct and group messages) with the connected account. Pass them to Get Users By IDs for profiles.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const userIds = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/users/known',
    });
    return { userIds, count: userIds.length };
  },
});
