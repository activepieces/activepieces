import { slackAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { UsersListResponse, WebClient } from '@slack/web-api';

export const findUserByHandleAction = createAction({
  auth: slackAuth,
  name: 'slack-find-user-by-handle',
  displayName: 'Find User by Handle',
  description: 'Finds a user by matching against their Slack handle.',
  props: {
    handle: Property.ShortText({
      displayName: 'Handle',
      description: 'User handle (display name), without the leading @',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const handle = propsValue.handle.replace('@', '');
    const client = new WebClient(auth.access_token);
    for await (const page of client.paginate('users.list', {
      limit: 1000, // Only limits page size, not total number of results
    })) {
      const response = page as UsersListResponse;
      if (response.members) {
        const matchedMember = response.members.find(
          (member) => member.profile?.display_name === handle
        );
        if (matchedMember) {
          return matchedMember;
        }
      }
    }
    throw new Error(`Could not find user with handle @${handle}`);
  },
});
