import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseRemoveGroupMemberOutputSchema } from '../../output-schemas';

export const removeGroupMemberAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_remove_group_member',
  outputSchema: metabaseRemoveGroupMemberOutputSchema,
  displayName: 'Remove Group Member',
  description: 'Remove a user from a permission group.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes one group membership. Takes the membership id (from the members of Get Group), not the user id. Needs an admin key.',
    idempotent: false,
  },
  props: {
    membershipId: Property.Number({
      displayName: 'Membership ID',
      description:
        'The membership_id of the member in Get Group, not the user id.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    await metabaseApi.removeGroupMember({
      auth,
      membershipId: propsValue.membershipId,
    });
    return { removed: true, membershipId: propsValue.membershipId };
  },
});
