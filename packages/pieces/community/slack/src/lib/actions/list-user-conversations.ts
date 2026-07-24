import { slackAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { UsersConversationsResponse, WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const listUserConversationsAction = createAction({
  auth: slackAuth,
  name: 'slack_list_user_conversations',
  displayName: 'List User Conversations',
  description: 'Lists the channels a user belongs to.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the channels and conversations a specific user (or the authenticated user if none is given) is a member of, paging through all results. Use this instead of List Channels when you only want the conversations one user belongs to. Read-only and repeatable.',
    idempotent: true,
  },
  props: {
    user: Property.ShortText({
      displayName: 'User ID',
      description:
        "Slack user ID to list conversations for, e.g. 'U0123456789'. Leave blank to use the authenticated user. Resolve a handle/email to an ID first with Find User by Handle / Find User by Email.",
      required: false,
    }),
    types: Property.ShortText({
      displayName: 'Types',
      description:
        "Comma-separated conversation types to include. One or more of 'public_channel', 'private_channel', 'mpim', 'im'. Defaults to public and private channels.",
      required: false,
      defaultValue: 'public_channel,private_channel',
    }),
    excludeArchived: Property.Checkbox({
      displayName: 'Exclude Archived',
      description: 'Omit archived channels from the results.',
      required: false,
      defaultValue: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new WebClient(getBotToken(auth as SlackAuthValue));
    const channels: NonNullable<UsersConversationsResponse['channels']> = [];

    let cursor: string | undefined;
    do {
      const response = (await client.users.conversations({
        user: propsValue.user || undefined,
        types: propsValue.types || 'public_channel,private_channel',
        exclude_archived: propsValue.excludeArchived ?? true,
        limit: 1000,
        cursor,
      })) as UsersConversationsResponse;

      if (response.channels) {
        channels.push(...response.channels);
      }
      cursor = response.response_metadata?.next_cursor;
    } while (cursor);

    return {
      channels: channels.map((channel) => ({
        id: channel.id,
        name: channel.name,
        is_private: channel.is_private,
        is_archived: channel.is_archived,
        is_im: channel.is_im,
      })),
      count: channels.length,
    };
  },
});
