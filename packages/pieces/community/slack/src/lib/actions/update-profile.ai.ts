import { createAction } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { updateProfileAction } from './update-profile';

export const slackUpdateProfile = createAction({
  auth: slackAuth,
  name: 'update_profile',
  displayName: 'Update Profile',
  description: 'Update basic profile fields (name, title, email) for a user.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates basic profile fields (first name, last name, email) for the authenticated user, or for another user when an admin supplies a user ID. Use Set User Status instead to change only the custom status text/emoji. Requires a user token; setting the same values again is idempotent. Changing the email sends Slack notification emails to both addresses, and editing another user is admin-only on paid teams.',
    idempotent: true,
  },
  props: updateProfileAction.props,
  run: updateProfileAction.run,
});
