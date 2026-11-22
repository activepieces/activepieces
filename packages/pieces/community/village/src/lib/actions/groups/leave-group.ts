import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const leaveGroup = createAction({
  auth: villageAuth,
  name: 'leave_group',
  classification: 'DESTRUCTIVE',
  displayName: 'Leave Group',
  description:
    'Leave a group you are a member of. If you are the last member, the group is deleted. Admins must remove all other members before leaving.',
  audience: 'both',
  aiMetadata: {
    description:
      'Remove yourself from a group by group_id, a state-changing write that revokes your access to its shared network; if you are the last member the group is deleted entirely. Admins must remove all other members before they can leave. Find the group_id via List Groups.',
    idempotent: false,
  },
  outputSchema: villageSchemas.successResult,
  props: {
    group_id: Property.ShortText({
      displayName: 'Group ID',
      description: 'ID of the group to leave',
      required: true,
    }),
  },
  async run(context) {
    const { group_id } = context.propsValue;

    const response = await villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/v2/groups/leave`,
      body: { group_id },
    });
    return response;
  },
});
