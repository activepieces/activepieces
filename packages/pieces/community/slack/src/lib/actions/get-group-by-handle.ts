import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const getGroupByHandleAction = createAction({
  auth: slackAuth,
  name: 'get_group_by_handle',
  displayName: 'Get User Group by Handle',
  description: 'Finds a Slack user group by its handle (e.g., @user-group) and returns its details, including the ID.',
  props: {
    handle: Property.ShortText({
      displayName: 'Group Handle',
      description: 'The handle of the user group with or without the @ symbol (e.g., user-group or @user-group)',
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