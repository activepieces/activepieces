import { slackAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const slackListUserGroups = createAction({
  auth: slackAuth,
  name: 'list_user_groups',
  displayName: 'List User Groups',
  description: 'List all Slack user groups (subteams) in the workspace.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists all user groups (subteams) in the workspace, with optional toggles to include disabled groups and each group\'s member user IDs. Use this to enumerate groups or to discover a group ID; use Find User Group by Handle when you already know the handle of a single group. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    includeDisabled: Property.Checkbox({
      displayName: 'Include disabled groups?',
      description: 'Include disabled user groups in the results.',
      required: false,
      defaultValue: false,
    }),
    includeUsers: Property.Checkbox({
      displayName: 'Include members?',
      description: 'Include the list of member user IDs for each user group.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new WebClient(getBotToken(auth as SlackAuthValue));
    return await client.usergroups.list({
      include_disabled: propsValue.includeDisabled,
      include_users: propsValue.includeUsers,
    });
  },
});
