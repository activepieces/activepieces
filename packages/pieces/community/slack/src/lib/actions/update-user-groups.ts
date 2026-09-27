import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { WebClient } from '@slack/web-api';
import { getBotToken, requireUserToken, SlackAuthValue } from '../common/auth-helpers';
import { updateGroupUsersActionOutputSchema } from '../output-schemas';

export const updateGroupUsersAction = createAction({
  auth: slackAuth,
  name: 'update_group_users',
  classification: 'WRITE',
  displayName: 'Update User Group Members',
  description: 'Add users to or overwrite the member list of a Slack user group.',
  audience: 'both',
  aiMetadata: {
    description:
      'Set the membership of a Slack user group, found by its handle, to a given list of user IDs. Defaults to appending the IDs to current members; with "Append" off it replaces the entire member list (clearing it if no IDs are given), which is idempotent. Append mode is not idempotent. Requires a user token and errors if the handle is not found.',
    idempotent: false,
  },
  outputSchema: updateGroupUsersActionOutputSchema,
  props: {
    handle: Property.ShortText({
      displayName: 'Group Handle',
      description: 'Handle without the leading @.',
      placeholder: 'engineering',
      required: true,
    }),
    userIds: Property.Array({
      displayName: 'User IDs',
      description: 'Slack user IDs to add. Empty with append off clears the group.',
      required: false,
    }),
    appendUsers: Property.Checkbox({
      displayName: 'Append to Existing Members',
      description: 'Off replaces the member list with the users above.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const auth = context.auth as SlackAuthValue;
    const botClient = new WebClient(getBotToken(auth));
    const userClient = new WebClient(requireUserToken(auth));
    const searchHandle = context.propsValue.handle.replace('@', '').toLowerCase();
    const rawUserIds = (context.propsValue.userIds || []) as string[];
    const userIds = rawUserIds.filter((id) => id && id.trim() !== '');
    const appendUsers = context.propsValue.appendUsers;

    const listResponse = await botClient.usergroups.list({ include_users: true });

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

    const usersString = finalUserIds.join(', ');

    const updateResponse = await userClient.usergroups.users.update({
      usergroup: group.id,
      users: usersString,
    });

    return updateResponse;
  },
});
