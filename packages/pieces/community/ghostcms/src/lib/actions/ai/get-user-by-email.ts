import { createAction, Property } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { GhostApiError } from '../../common/client';
import { ghostResource } from '../../common/resources';
import { ghostGetUserByEmailOutputSchema } from '../../output-schemas';

export const ghostGetUserByEmail = createAction({
  auth: ghostAuth,
  name: 'ghost_get_user_by_email',
  outputSchema: ghostGetUserByEmailOutputSchema,
  classification: 'READ',
  displayName: 'Get User by Email',
  description: 'Find a staff user by exact email address.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Looks up a staff user (not a member) by exact email and returns found true with the user, or found false. Use Get Member by Email for members.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The staff user email address.',
      required: true,
    }),
  },
  async run(context) {
    const email = context.propsValue.email.trim();
    if (!email) {
      throw new Error('Email is required.');
    }
    try {
      const user = await ghostResource.get(context.auth, 'users', `email/${encodeURIComponent(email)}`, {
        include: 'roles,count.posts',
      });
      return { found: true, user };
    } catch (error) {
      if (error instanceof GhostApiError && error.status === 404) {
        return { found: false, user: null };
      }
      throw error;
    }
  },
});
