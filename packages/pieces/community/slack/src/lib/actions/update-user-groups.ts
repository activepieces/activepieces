import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { slackAuth } from '../auth';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const updateGroupUsersAction = createAction({
  auth: slackAuth,
  name: 'update_group_users',
  displayName: 'Update User Group Members',
  description: 'Add users to or overwrite the member list of a Slack user group.',
  props: {
    handle: Property.ShortText({
      displayName: 'Group Handle',
      description: 'The handle of the user group to update (e.g., @ap-support)',
      required: true,
    }),
    userIds: Property.Array({
      displayName: 'User IDs',
      description: 'The list of Slack User IDs to update this group with.',
      required: false,
    }),
    appendUsers: Property.Checkbox({
      displayName: 'Append to existing members?',
      description: 'If checked, these users will be added to the current group. If unchecked, the current group members will be completely replaced by these users.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const token = getBotToken(context.auth as SlackAuthValue);
    const searchHandle = context.propsValue.handle.replace('@', '').toLowerCase();
    const userIds = (context.propsValue.userIds as string[]).filter((id) => id && id.trim() !== '');
    const appendUsers = context.propsValue.appendUsers;

    const listResponse = await httpClient.sendRequest<{ ok: boolean; usergroups: any[]; error?: string }>({
      method: HttpMethod.GET,
      url: 'https://slack.com/api/usergroups.list?include_users=true',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!listResponse.body.ok) {
      throw new Error(`Slack API error fetching groups: ${listResponse.body.error}`);
    }

    const group = listResponse.body.usergroups.find(
      (g) => g.handle && g.handle.toLowerCase() === searchHandle
    );

    if (!group) {
      throw new Error(`User group with handle '@${searchHandle}' not found.`);
    }

    let finalUserIds = userIds;

    if (appendUsers) {
      const existingUsers = group.users || [];
      finalUserIds = Array.from(new Set([...existingUsers, ...userIds]));
    }

    const usersString = finalUserIds.join(',');

    const updateResponse = await httpClient.sendRequest<{ ok: boolean; usergroup: any; error?: string }>({
      method: HttpMethod.POST,
      url: 'https://slack.com/api/usergroups.users.update',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: {
        usergroup: group.id,
        users: usersString,
      },
    });

    if (!updateResponse.body.ok) {
      throw new Error(`Slack API error updating users: ${updateResponse.body.error}`);
    }

    return updateResponse.body.usergroup;
  },
});