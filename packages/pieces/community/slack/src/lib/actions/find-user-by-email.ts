import { slackAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const findUserByEmailAction = createAction({
  auth: slackAuth,
  name: 'slack-find-user-by-email',
  displayName: 'Find User by Email',
  description: 'Finds a user by matching against their email address.',
  audience: 'both',
  aiMetadata: {
    description:
      'Look up a single Slack user by their exact email address, returning their profile and user ID. Pick this to resolve an email into a Slack user ID before messaging or referencing that user. Read-only and idempotent; errors if no workspace member matches the email.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const email = propsValue.email;
    const client = new WebClient(getBotToken(auth as SlackAuthValue));
    return await client.users.lookupByEmail({
      email,
    });
  },
});
