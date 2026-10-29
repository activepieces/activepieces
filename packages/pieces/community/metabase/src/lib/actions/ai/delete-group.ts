import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseDeleteGroupOutputSchema } from '../../output-schemas';

export const deleteGroupAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_delete_group',
  outputSchema: metabaseDeleteGroupOutputSchema,
  displayName: 'Delete Group',
  description: 'Delete a permission group.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a permission group and its memberships; members lose the access it granted. Needs an admin key.',
    idempotent: false,
  },
  props: {
    groupId: metabaseAiProps.groupId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await metabaseApi.deleteGroup({
      auth,
      groupId: propsValue.groupId,
    });
    return { deleted: true, groupId: propsValue.groupId };
  },
});
