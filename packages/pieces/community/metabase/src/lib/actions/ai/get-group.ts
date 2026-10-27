import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseGetGroupOutputSchema } from '../../output-schemas';

export const getGroupAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_get_group',
  outputSchema: metabaseGetGroupOutputSchema,
  displayName: 'Get Group',
  description: 'Get a permission group with its members.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns a permission group with its members; each member carries the membership_id that Remove Group Member needs. Needs an admin key.',
    idempotent: true,
  },
  props: {
    groupId: metabaseAiProps.groupId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.getGroup({
      auth,
      groupId: propsValue.groupId,
    });
  },
});
