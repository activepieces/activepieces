import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

export const leaveGroup = createAction({
  auth: villageAuth,
  name: 'leave_group',
  displayName: 'Leave Group',
  description:
    'Leave a group you are a member of. If you are the last member, the group is deleted. Admins must remove all other members before leaving.',
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
      headers: { Authorization: `Bearer ${context.auth}` },
      body: { group_id },
    });
    return response.body;
  },
});
