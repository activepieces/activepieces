import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const joinGroup = createAction({
  auth: villageAuth,
  name: 'join_group',
  classification: 'WRITE',
  displayName: 'Join Group',
  description:
    'Join a group using an invite link. Once joined, you gain access to the shared network of all group members.',
  audience: 'both',
  aiMetadata: {
    description:
      'Add yourself to a group via its invite-link code, which changes your membership and grants access to the group\'s shared network. This is a state-changing write, not a read; to enumerate groups you already belong to use List Groups, and to exit one use Leave Group.',
    idempotent: false,
  },
  outputSchema: villageSchemas.successResult,
  props: {
    group_invite_link: Property.ShortText({
      displayName: 'Group Invite Link',
      description: 'The invite link code shared by a group admin or member',
      required: true,
    }),
  },
  async run(context) {
    const { group_invite_link } = context.propsValue;

    const response = await villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/v2/groups/join`,
      body: { group_invite_link },
    });
    return response;
  },
});
