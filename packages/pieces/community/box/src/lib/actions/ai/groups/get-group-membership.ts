import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const getGroupMembershipAction = createAction({
  auth: boxAuth,
  name: 'box_get_group_membership',
  displayName: 'Get Group Membership',
  description: 'Gets a Box group membership by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one group membership: the user, the group and the role. Get the ID from Add User To Group, List Group Memberships or List User Memberships.',
    idempotent: true,
  },
  props: {
    groupMembershipId: boxAiProps.groupMembershipId({ required: true }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/group_memberships/${encodeURIComponent(propsValue.groupMembershipId)}`,
      query: { fields: propsValue.fields },
    });
  },
});
