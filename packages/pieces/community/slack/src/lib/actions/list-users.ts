import { createAction, Property } from '@activepieces/pieces-framework';
import { UsersListResponse, WebClient } from '@slack/web-api';
import { slackAuth } from '../..';
import { Member } from '@slack/web-api/dist/types/response/UsersListResponse';

export const listUsers = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'listUsers',
  displayName: 'List users',
  description: 'List all users of the workspace',
  props: {
    includeBots: Property.Checkbox({
      displayName: 'Include bots?',
      required: true,
      defaultValue: false,
    }),
    includeDisabled: Property.Checkbox({
      displayName: 'Include disabled users?',
      required: true,
      defaultValue: false,
    }),
  },
  auth: slackAuth,
  async run({ auth, propsValue }) {
    const client = new WebClient(auth.access_token);
    const results: Member[] = [];
    for await (const page of client.paginate('users.list', {
      limit: 1000, // Only limits page size, not total number of results
    })) {
      const response = page as UsersListResponse;
      if (response.members) {
        results.push(
          ...response.members.filter(
            (member) =>
              (propsValue.includeDisabled || !member.deleted) &&
              (propsValue.includeBots || !member.is_bot)
          )
        );
      }
    }
    return results;
  },
});
