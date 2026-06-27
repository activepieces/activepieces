import { slackAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ConversationsListResponse, WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const findChannelAction = createAction({
  auth: slackAuth,
  name: 'slack_find_channel',
  displayName: 'Find Channel',
  description: 'Finds a channel by name and returns its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Resolve a channel #name to its channel ID by scanning public and private channels. This is the channel name-to-ID resolver every other channel action needs, since they take a channel ID. Use List Channels to enumerate all channels instead of matching one. Only public and private channels have names; direct messages cannot be matched here. Read-only and repeatable.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Channel Name',
      description:
        "The channel name to find, with or without the leading '#', e.g. 'general'. Matched case-insensitively after Slack's normalization (lowercase, spaces to hyphens).",
      required: true,
    }),
    excludeArchived: Property.Checkbox({
      displayName: 'Exclude Archived',
      description: 'Skip archived channels when searching.',
      required: false,
      defaultValue: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new WebClient(getBotToken(auth as SlackAuthValue));
    const target = propsValue.name.replace(/^#/, '').trim().toLowerCase();
    const normalizedTarget = target.replace(/\s+/g, '-');

    let cursor: string | undefined;
    do {
      const response = (await client.conversations.list({
        types: 'public_channel,private_channel',
        exclude_archived: propsValue.excludeArchived ?? true,
        limit: 1000,
        cursor,
      })) as ConversationsListResponse;

      const match = (response.channels ?? []).find((channel) => {
        const channelName = (channel.name ?? '').toLowerCase();
        return channelName === target || channelName === normalizedTarget;
      });
      if (match) {
        return match;
      }

      cursor = response.response_metadata?.next_cursor;
    } while (cursor);

    throw new Error(`Could not find channel named #${propsValue.name}`);
  },
});
