import { slackAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { WebClient } from '@slack/web-api';
import { requireUserToken, SlackAuthValue } from '../common/auth-helpers';

export const updateProfileAction = createAction({
  auth: slackAuth,
  name: 'slack-update-profile',
  displayName: 'Update Profile',
  description: 'Update basic profile field such as name or title.',
  audience: 'both',
  aiMetadata: { description: "Update basic profile fields (first name, last name, email) for the authenticated user, or for another user when an admin specifies a user ID; requires a user token. Setting the same values again is idempotent. Note that changing the email triggers Slack notification emails to both addresses, and editing another user is admin-only on paid teams.", idempotent: true },
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
      description: `Changing a user's email address will send an email to both the old and new addresses, and also post a slackbot message to the user informing them of the change.`,
      required: false,
    }),
    userId: Property.ShortText({
      displayName: 'User',
      description:
        'ID of user to change. This argument may only be specified by admins on paid teams.You can use **Find User by Email** action to retrieve ID.',
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
