import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseDeactivateUserOutputSchema } from '../../output-schemas';

export const deactivateUserAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_deactivate_user',
  outputSchema: metabaseDeactivateUserOutputSchema,
  displayName: 'Deactivate User',
  description: 'Deactivate a user.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deactivates a user so they can no longer log in; their content stays. Reverse it with Reactivate User. Needs an admin key.',
    idempotent: true,
  },
  props: {
    userId: metabaseAiProps.userId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.deactivateUser({
      auth,
      userId: propsValue.userId,
    });
  },
});
