import { slackAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const findUserByEmailAction = createAction({
  auth: slackAuth,
  name: 'slack-find-user-by-email',
  displayName: 'Find User by Email',
  description: 'Finds a user by matching against their email address.',
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
