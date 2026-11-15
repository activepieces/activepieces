import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calcomAuth } from '../auth';
import { calcomCommon } from '../common';
import { profileActionOutputSchema } from '../output-schemas';

export const calcomGetMyProfile = createAction({
  auth: calcomAuth,
  name: 'calcom_get_my_profile',
  classification: 'READ',
  displayName: 'Get My Profile',
  description: 'Get the profile of the connected Cal.com user.',
  audience: 'ai',
  outputSchema: profileActionOutputSchema,
  aiMetadata: {
    description:
      'Retrieves the authenticated user\'s own profile: id, name, email, username and default timezone. Common prerequisite for actions that need the current user\'s id or timezone.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const { auth } = context;

    return await calcomCommon.calRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/me',
    });
  },
});
