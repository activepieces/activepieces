import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const getGroupByHandleAction = createAction({
  auth: slackAuth,
  name: 'get_group_by_handle',
  displayName: 'Get User Group by Handle',
  description: 'Finds a Slack user group by its handle (e.g., @user-group) and returns its details. To mention this group in a message, map the returned ID using the syntax <!subteam^ID>. Read more: https://api.slack.com/reference/surfaces/formatting#mentioning-groups',
  props: {
    handle: Property.ShortText({
      displayName: 'Group Handle',
      description: 'Group handle without the leading @',
      required: true,
    }),
  },
  async run(context) {
    const token = getBotToken(context.auth as SlackAuthValue);
    const client = new WebClient(token);
    const searchHandle = context.propsValue.handle.replace('@', '').toLowerCase();

    const response = await client.usergroups.list();

    const group = response.usergroups?.find(
      (g) => g.handle && g.handle.toLowerCase() === searchHandle
    );

    if (!group) {
      throw new Error(`User group with handle '@${searchHandle}' not found.`);
    }

    return group; 
  },
});
