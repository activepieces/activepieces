import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseGetUserOutputSchema } from '../../output-schemas';

export const getUserAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_get_user',
  outputSchema: metabaseGetUserOutputSchema,
  displayName: 'Get User',
  description: 'Get a user by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one user with email, name, admin status and group memberships. Reading another user needs an admin key.',
    idempotent: true,
  },
  props: {
    userId: metabaseAiProps.userId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.getUser({
      auth,
      userId: propsValue.userId,
    });
  },
});
