import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';

export const getChannelMessageHostedContent = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_get_channel_message_hosted_content',
  displayName: 'Get Channel Message Hosted Content',
  description: 'Downloads one hosted content (such as an inline image) of a channel message or reply as base64.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Downloads the bytes of one hosted content (inline image, code snippet) of a channel message, or of one reply when Reply ID is set, as base64. Hosted content IDs come from List Channel Message Hosted Contents, called with the same message and reply IDs.',
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
    hostedContentId: Property.ShortText({
      displayName: 'Hosted Content ID',
      description: 'The hosted content ID, from List Channel Message Hosted Contents.',
      required: true,
    }),
  },
  async run(context) {
    const { teamId, channelId, messageId, replyId, hostedContentId } = context.propsValue;
    const base = `/teams/${teamId}/channels/${channelId}/messages/${messageId}`;
    const message = replyId ? `${base}/replies/${replyId}` : base;
    const contentBase64 = await microsoftTeamsClient.getBase64({
      auth: context.auth,
      path: `${message}/hostedContents/${hostedContentId}/$value`,
    });
    return { id: hostedContentId, contentBase64 };
  },
});
