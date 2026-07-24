import { slackAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ConversationsListResponse, WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const listChannelsAction = createAction({
  auth: slackAuth,
  name: 'slack_list_channels',
  displayName: 'List Channels',
  description: 'Lists channels in the workspace.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Enumerate the channels in the workspace, paging through all results and returning each id, name, privacy and archived state. Use this to browse or list channels; use Find Channel when you already know the name and just need its ID, or List User Conversations to list only the channels a specific user belongs to. Read-only and repeatable.',
    idempotent: true,
  },
  props: {
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
    const channels: NonNullable<ConversationsListResponse['channels']> = [];

    let cursor: string | undefined;
    do {
      const response = (await client.conversations.list({
        types: propsValue.types || 'public_channel,private_channel',
        exclude_archived: propsValue.excludeArchived ?? true,
        limit: 1000,
        cursor,
      })) as ConversationsListResponse;

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
        is_member: channel.is_member,
        num_members: channel.num_members,
      })),
      count: channels.length,
    };
  },
});
