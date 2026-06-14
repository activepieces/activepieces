import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

export const leaveGroup = createAction({
  auth: villageAuth,
  name: 'leave_group',
  displayName: 'Leave Group',
  description:
    'Leave a group you are a member of. If you are the last member, the group is deleted. Admins must remove all other members before leaving.',
  audience: 'both',
  aiMetadata: {
    description:
      'Remove yourself from a group by group_id, a state-changing write that revokes your access to its shared network; if you are the last member the group is deleted entirely. Admins must remove all other members before they can leave. Find the group_id via List Groups.',
    idempotent: false,
  },
  props: {
    group_id: Property.ShortText({
      displayName: 'Group ID',
      description: 'ID of the group to leave',
      required: true,
    }),
  },
  async run(context) {
    const { group_id } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${VILLAGE_API_BASE_URL}/v2/groups/leave`,
      headers: { Authorization: `Bearer ${context.auth.secret_text}` },
      body: { group_id },
    });
    return response.body;
  },
});
