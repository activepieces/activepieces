import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsUtils } from '../../../common/utils';
import { microsoftTeamsGetChannelMessageByIdOutputSchema } from '../../../output-schemas';

export const postChannelMessage = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_post_channel_message',
  outputSchema: microsoftTeamsGetChannelMessageByIdOutputSchema,
  displayName: 'Post Channel Message',
  description: 'Posts a new top-level message to a channel.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Posts a new top-level message to a channel; use Post Channel Message Reply to answer an existing thread. To @mention users, set Content Type to html, add each user to Mentions (user ID from List Team Members or List Users) and write mention N as <at id="N">displayName</at> in Content, N being its index in Mentions starting at 0; the action rejects mentions with text content or a missing tag. Team IDs come from List Joined Teams and channel IDs from List Channels.',
    idempotent: false,
  },
  props: {
    teamId: microsoftTeamsAiProps.teamId({ required: true }),
    channelId: microsoftTeamsAiProps.channelId({ required: true }),
    content: Property.LongText({
      displayName: 'Content',
      description:
        'The message body. With mentions, use html and write mention N as <at id="N">displayName</at>, N being its index in Mentions starting at 0.',
      required: true,
    }),
    contentType: microsoftTeamsAiProps.contentType(),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'An optional subject line shown above the message.',
      required: false,
    }),
    mentions: microsoftTeamsAiProps.mentions(),
  },
  async run(context) {
    const { teamId, channelId, content, contentType, subject, mentions } = context.propsValue;
    const body = microsoftTeamsUtils.buildMessageBody({ content, contentType, subject, mentions: mentions ?? [] });
    const client = microsoftTeamsClient.create({ auth: context.auth });
    return await client.api(`/teams/${teamId}/channels/${channelId}/messages`).post(body);
  },
});
