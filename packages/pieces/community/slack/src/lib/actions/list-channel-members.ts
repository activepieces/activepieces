import { slackAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ConversationsMembersResponse, WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const listChannelMembersAction = createAction({
  auth: slackAuth,
  name: 'slack_list_channel_members',
  displayName: 'List Channel Members',
  description: 'Lists the user IDs of the members of a channel.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the user IDs of every member of a channel, paging through all results. Use this to enumerate who is in a channel; resolve each returned ID to a user with Get User. Use Get Channel Info for channel metadata instead. Read-only and repeatable.',
    idempotent: true,
  },
  props: {
    channel: Property.ShortText({
      displayName: 'Channel',
      description:
        "Channel ID (e.g. 'C0123456789'). Pass a channel ID, or resolve a #name to an ID first with Find Channel.",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new WebClient(getBotToken(auth as SlackAuthValue));
    const members: string[] = [];

    let cursor: string | undefined;
    do {
      const response = (await client.conversations.members({
        channel: propsValue.channel,
        limit: 1000,
        cursor,
      })) as ConversationsMembersResponse;

      if (response.members) {
        members.push(...response.members);
      }
      cursor = response.response_metadata?.next_cursor;
    } while (cursor);

    return {
      members,
      count: members.length,
    };
  },
});
