import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

export const joinGroup = createAction({
  auth: villageAuth,
  name: 'join_group',
  displayName: 'Join Group',
  description:
    'Join a group using an invite link. Once joined, you gain access to the shared network of all group members.',
  audience: 'both',
  aiMetadata: {
    description:
      'Add yourself to a group via its invite-link code, which changes your membership and grants access to the group\'s shared network. This is a state-changing write, not a read; to enumerate groups you already belong to use List Groups, and to exit one use Leave Group.',
    idempotent: false,
  },
  props: {
    group_invite_link: Property.ShortText({
      displayName: 'Group Invite Link',
      description: 'The invite link code shared by a group admin or member',
      required: true,
    }),
  },
  async run(context) {
    const { group_invite_link } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${VILLAGE_API_BASE_URL}/v2/groups/join`,
      headers: { Authorization: `Bearer ${context.auth.secret_text}` },
      body: { group_invite_link },
    });
    return response.body;
  },
});
