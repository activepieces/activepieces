import { createAction, Property } from '@activepieces/pieces-framework';
import {
  profilePicture,
  slackChannel,
  username,
  blocks,
  threadTs,
  singleSelectChannelInfo,
  mentionOriginFlow,
} from '../common/props';
import { processMessageTimestamp, slackSendMessage } from '../common/utils';
import { slackAuth } from '../../';
import { Block,KnownBlock } from '@slack/web-api';


export const slackSendMessageAction = createAction({
  auth: slackAuth,
  name: 'send_channel_message',
  displayName: 'Send Message To A Channel',
  description: 'Send message to a channel',
  props: {
    info: singleSelectChannelInfo,
    channel: slackChannel(true),
    text: Property.LongText({
      displayName: 'Message',
      description: 'The text of your message. When using Block Kit blocks, this is used as a fallback for notifications.',
      required: false,
    }),
    threadTs,
    username,
    profilePicture,
    file: Property.File({
      displayName: 'Attachment',
      required: false,
    }),
    replyBroadcast: Property.Checkbox({
      displayName: 'Broadcast reply to channel',
      description: 'When replying to a thread, also make the message visible to everyone in the channel (only applicable when Thread Timestamp is provided)',
      required: false,
      defaultValue: false,
    }),
    mentionOriginFlow,
    unfurlLinks: Property.Checkbox({
      displayName: 'Unfurl Links',
      description: 'Enable link unfurling for this message',
      required: false,
      defaultValue: true,
    }),
    blocks,
  },
  async run(context) {
    const token = context.auth.access_token;
    const { text, channel, username, profilePicture, threadTs, file, mentionOriginFlow, blocks, replyBroadcast, unfurlLinks } =
      context.propsValue;
    
    if (!text && (!blocks || !Array.isArray(blocks) || blocks.length === 0)) {
      throw new Error('Either Message or Block Kit blocks must be provided');
    }

    const blockList: (KnownBlock | Block)[] = [];


    if (text && (!blocks || !Array.isArray(blocks) || blocks.length === 0)) {
      blockList.push({ type: 'section', text: { type: 'mrkdwn', text } });
    }

    if(blocks && Array.isArray(blocks) && blocks.length > 0) { 
      blockList.push(...(blocks as unknown as (KnownBlock | Block)[]))
    }

    if(mentionOriginFlow) {
      (blockList as KnownBlock[])?.push({ type: 'context', elements: [
        {
          "type": "mrkdwn",
          "text": `Message sent by <${new URL(context.server.publicUrl).origin}/projects/${context.project.id}/flows/${context.flows.current.id}|this flow>.`
        }
      ] })
    }

    return slackSendMessage({
      token,
      text: text || undefined,
      username,
      profilePicture,
      conversationId: channel,
      threadTs: threadTs ? processMessageTimestamp(threadTs) : undefined,
      file,
      blocks: blockList.length > 0 ? blockList : undefined,
      replyBroadcast,
      unfurlLinks,
    });
  },
});
