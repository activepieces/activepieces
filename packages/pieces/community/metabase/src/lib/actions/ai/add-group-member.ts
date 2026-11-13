import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseAddGroupMemberOutputSchema } from '../../output-schemas';

export const addGroupMemberAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_add_group_member',
  outputSchema: metabaseAddGroupMemberOutputSchema,
  displayName: 'Add Group Member',
  description: 'Add a user to a permission group.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Adds a user to a permission group and returns the group's memberships. Needs an admin key; fails if the user is already a member.",
    idempotent: false,
  },
  props: {
    groupId: metabaseAiProps.groupId({ required: true }),
    userId: metabaseAiProps.userId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.addGroupMember({
      auth,
      body: { group_id: propsValue.groupId, user_id: propsValue.userId },
    });
  },
});
