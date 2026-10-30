import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsUtils } from '../../../common/utils';

export const postChannelMessageReply = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_post_channel_message_reply',
  displayName: 'Post Channel Message Reply',
  description: 'Posts a reply in the thread of a channel message.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Posts a reply in the thread of an existing top-level channel message; use Post Channel Message to start a new thread. Message IDs come from List Channel Messages or Post Channel Message. To @mention users, set Content Type to html, add each user to Mentions (user ID from List Team Members or List Users) and write mention N as <at id="N">displayName</at> in Content, N being its index in Mentions starting at 0; the action rejects mentions with text content or a missing tag. Team IDs come from List Joined Teams and channel IDs from List Channels.',
    idempotent: false,
  },
  props: {
    teamId: microsoftTeamsAiProps.teamId({ required: true }),
    channelId: microsoftTeamsAiProps.channelId({ required: true }),
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of the top-level message to reply to, from List Channel Messages or Post Channel Message.',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description:
        'The message body. With mentions, use html and write mention N as <at id="N">displayName</at>, N being its index in Mentions starting at 0.',
      required: true,
    }),
    contentType: microsoftTeamsAiProps.contentType(),
    mentions: microsoftTeamsAiProps.mentions(),
  },
  async run(context) {
    const { teamId, channelId, messageId, content, contentType, mentions } = context.propsValue;
    const body = microsoftTeamsUtils.buildMessageBody({ content, contentType, mentions: mentions ?? [] });
    const client = microsoftTeamsClient.create({ auth: context.auth });
    return await client.api(`/teams/${teamId}/channels/${channelId}/messages/${messageId}/replies`).post(body);
  },
});
