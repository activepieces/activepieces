import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseReactivateUserOutputSchema } from '../../output-schemas';

export const reactivateUserAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_reactivate_user',
  outputSchema: metabaseReactivateUserOutputSchema,
  displayName: 'Reactivate User',
  description: 'Reactivate a deactivated user.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Restores a deactivated user's access. Fails if the user is already active. Needs an admin key.",
    idempotent: false,
  },
  props: {
    userId: metabaseAiProps.userId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.reactivateUser({
      auth,
      userId: propsValue.userId,
    });
  },
});
