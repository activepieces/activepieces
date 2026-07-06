import { slackAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { UsersListResponse, WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const findUserByHandleAction = createAction({
  auth: slackAuth,
  name: 'slack-find-user-by-handle',
  displayName: 'Find User by Handle',
  description: 'Finds a user by matching against their Slack handle.',
  audience: 'both',
  aiMetadata: { description: 'Look up a workspace member by their Slack handle (display name without the leading @) and return that member; read-only and repeatable. Pick this when you only know the handle and need the user object or ID; use Find User by ID when you already have the user ID. Scans the full member list and errors if no exact display-name match is found.', idempotent: true },
  props: {
    handle: Property.ShortText({
      displayName: 'Handle',
      description: 'User handle (display name), without the leading @',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const handle = propsValue.handle.replace('@', '');
    const client = new WebClient(getBotToken(auth as SlackAuthValue));
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
