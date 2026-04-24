import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const updateGroupUsersAction = createAction({
  auth: slackAuth,
  name: 'update_group_users',
  displayName: 'Update User Group Members',
  description: 'Add users to or overwrite the member list of a Slack user group.',
  props: {
    handle: Property.ShortText({
      displayName: 'Group Handle',
      description: 'Group handle (display user group name), without the leading @',
      required: true,
    }),
    userIds: Property.Array({
      displayName: 'User IDs',
      description: 'The list of Slack User IDs to update this group with. Leave empty to clear the group (if not appending).',
      required: false,
    }),
    appendUsers: Property.Checkbox({
      displayName: 'Append to existing members?',
      description: 'If checked, these users will be added to the current group. If unchecked, the current group members will be completely replaced by these users.',
      required: true,
      defaultValue: true,
    }),
  },
  async run(context) {
    const token = getBotToken(context.auth as SlackAuthValue);
    const client = new WebClient(token);
    const searchHandle = context.propsValue.handle.replace('@', '').toLowerCase();
    const rawUserIds = (context.propsValue.userIds || []) as string[];
    const userIds = rawUserIds.filter((id) => id && id.trim() !== '');
    const appendUsers = context.propsValue.appendUsers;

    const listResponse = await client.usergroups.list({ include_users: true });

    const group = listResponse.usergroups?.find(
      (g) => g.handle && g.handle.toLowerCase() === searchHandle
    );

    if (!group || !group.id) {
      throw new Error(`User group with handle '@${searchHandle}' not found.`);
    }

    let finalUserIds = userIds;

    if (appendUsers) {
      const existingUsers = group.users || [];
      finalUserIds = Array.from(new Set([...existingUsers, ...userIds]));
    }

    const usersString = finalUserIds.join(',');

    const updateResponse = await client.usergroups.users.update({
      usergroup: group.id,
      users: usersString,
    });

    return updateResponse;
  },
});
