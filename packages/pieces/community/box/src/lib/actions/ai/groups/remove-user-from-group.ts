import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const removeUserFromGroupAction = createAction({
  auth: boxAuth,
  name: 'box_remove_user_from_group',
  displayName: 'Remove User From Group',
  description: 'Removes a user from a Box group.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes one group membership, removing the user from the group and any access it gave them; Add User To Group can add them back. Takes the membership ID, not the user ID: get it from List Group Memberships or List User Memberships.',
    idempotent: false,
  },
  props: {
    groupMembershipId: boxAiProps.groupMembershipId({
      required: true,
      description: 'ID of the membership to delete. Get it from List Group Memberships or List User Memberships.',
    }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/group_memberships/${encodeURIComponent(propsValue.groupMembershipId)}`,
    });
    return { deleted: true, groupMembershipId: propsValue.groupMembershipId };
  },
});
