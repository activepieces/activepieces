import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsListChannelMessageHostedContentsOutputSchema } from '../../../output-schemas';

export const listChannelMessageHostedContents = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_list_channel_message_hosted_contents',
  outputSchema: microsoftTeamsListChannelMessageHostedContentsOutputSchema,
  displayName: 'List Channel Message Hosted Contents',
  description: 'Lists the inline images and other hosted content of a channel message or reply.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the hosted contents (inline images, code snippets) of one channel message, or of one reply when Reply ID is set; read the bytes of one with Get Channel Message Hosted Content. Message IDs come from List Channel Messages and reply IDs from List Channel Message Replies.',
    idempotent: true,
  },
  props: {
    teamId: microsoftTeamsAiProps.teamId({ required: true }),
    channelId: microsoftTeamsAiProps.channelId({ required: true }),
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'The top-level message ID, from List Channel Messages.',
      required: true,
    }),
    replyId: Property.ShortText({
      displayName: 'Reply ID',
      description: 'A reply ID under that message, from List Channel Message Replies. Leave empty for the message itself.',
      required: false,
    }),
  },
  async run(context) {
    const { teamId, channelId, messageId, replyId } = context.propsValue;
    const base = `/teams/${teamId}/channels/${channelId}/messages/${messageId}`;
    const message = replyId ? `${base}/replies/${replyId}` : base;
    return await microsoftTeamsClient.list({ auth: context.auth, path: `${message}/hostedContents` });
  },
});
