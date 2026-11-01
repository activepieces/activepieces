import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { ghostResource } from '../../common/resources';
import { ghostUserOutputSchema } from '../../output-schemas';

export const ghostGetUser = createAction({
  auth: ghostAuth,
  name: 'ghost_get_user',
  outputSchema: ghostUserOutputSchema,
  classification: 'READ',
  displayName: 'Get User',
  description: 'Get a staff user by ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns one staff user by ID with their name, email, slug, bio, roles and post count.',
    idempotent: true,
  },
  props: {
    user_id: ghostProps.id('User ID', 'The staff user ID, from List Users.'),
  },
  async run(context) {
    return ghostResource.get(context.auth, 'users', ghostCommon.id(context.propsValue.user_id, 'User ID'), {
      include: 'roles,count.posts',
    });
  },
});
