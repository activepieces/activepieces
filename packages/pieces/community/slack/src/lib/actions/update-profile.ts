import { slackAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { WebClient } from '@slack/web-api';
import { requireUserToken, SlackAuthValue } from '../common/auth-helpers';
import { updateProfileActionOutputSchema } from '../output-schemas';

export const updateProfileAction = createAction({
  auth: slackAuth,
  name: 'slack-update-profile',
  classification: 'WRITE',
  displayName: 'Update Profile',
  description: 'Updates name, email or title. Needs a user token.',
  audience: 'human',
  aiMetadata: { description: "Update basic profile fields (first name, last name, email) for the authenticated user, or for another user when an admin specifies a user ID; requires a user token. Setting the same values again is idempotent. Note that changing the email triggers Slack notification emails to both addresses, and editing another user is admin-only on paid teams.", idempotent: true },
  outputSchema: updateProfileActionOutputSchema,
  props: {
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Slack notifies both the old and new address.',
      required: false,
    }),
    userId: Property.ShortText({
      displayName: 'User ID',
      description: 'Admins on paid plans only. Empty updates the connected user.',
      placeholder: 'U012AB3CD',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new WebClient(requireUserToken(auth as SlackAuthValue));
    return client.users.profile.set({
      profile: {
        first_name: propsValue.firstName,
        last_name: propsValue.lastName,
        email: propsValue.email,
      },
      user: propsValue.userId,
    });
  },
});
