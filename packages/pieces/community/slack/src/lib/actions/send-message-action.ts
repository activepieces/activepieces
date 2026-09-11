import { createAction, Property } from '@activepieces/pieces-framework';
import {
  profilePicture,
  slackChannel,
  username,
  blocks,
  threadTs,
  singleSelectChannelInfo,
  mentionOriginFlow,
  iconEmoji,
} from '../common/props';
import { buildFlowOriginContextBlock, processMessageTimestamp, slackSendMessage, textToSectionBlocks } from '../common/utils';
import { slackAuth } from '../auth';
import { Block,KnownBlock } from '@slack/web-api';
import { getBotToken, requireUserToken, SlackAuthValue } from '../common/auth-helpers';
import { chatPostMessageOutputSchema } from '../output-schemas';


export const slackSendMessageAction = createAction({
  auth: slackAuth,
  name: 'send_channel_message',
  classification: 'WRITE',
  displayName: 'Send Message To A Channel',
  description: 'Send message to a channel',
  audience: 'human',
  aiMetadata: { description: 'Post a message to a channel, with optional Block Kit blocks, file attachment, custom username/icon, and link unfurling; can post as the bot or as the authenticated user. Provide a thread timestamp to reply within a thread (and optionally broadcast that reply to the channel). Each call posts a new message, so it is not idempotent; requires either message text or blocks. Use Send Message To A User for a private DM.', idempotent: false },
  outputSchema: chatPostMessageOutputSchema,
  props: {
    info: singleSelectChannelInfo,
    channel: slackChannel(true),
    text: Property.LongText({
      displayName: 'Message',
      description: 'Slack mrkdwn is supported. Empty sends blocks only.',
      required: false,
    }),
    sendAsBot:Property.Checkbox({
      displayName:'Send as Bot',
      description: 'Off posts as the connected user and needs a user token.',
      required:false,
      defaultValue:true
    }),
    threadTs,
    file: Property.File({
      displayName: 'Attachment',
      description: 'Sent with the message as its comment. Other options are skipped.',
      required: false,
    }),
    username,
    profilePicture,
    iconEmoji,
    replyBroadcast: Property.Checkbox({
      displayName: 'Also Post to Channel',
      description: 'When replying in a thread, also show the reply in the channel.',
      required: false,
      defaultValue: false,
      advanced: true,
    }),
    mentionOriginFlow,
    unfurlLinks: Property.Checkbox({
      displayName: 'Unfurl Links',
      description: 'Show link previews in the message.',
      required: false,
      defaultValue: true,
      advanced: true,
    }),
    blocks,
  },
  async run(context) {
    const { text, channel,sendAsBot, username, profilePicture, iconEmoji, threadTs, file, mentionOriginFlow, blocks, replyBroadcast, unfurlLinks } =
      context.propsValue;

    const token = sendAsBot ? getBotToken(context.auth as SlackAuthValue) : requireUserToken(context.auth as SlackAuthValue);

    if (!text && (!blocks || !Array.isArray(blocks) || blocks.length === 0)) {
      throw new Error('Either Message or Block Kit blocks must be provided');
    }

    const blockList: (KnownBlock | Block)[] = [];


    if (text) {
      blockList.push(...textToSectionBlocks(text));
    }

    if(blocks && Array.isArray(blocks) && blocks.length > 0) {
      blockList.push(...(blocks as unknown as (KnownBlock | Block)[]))
    }

    if(mentionOriginFlow) {
      blockList.push(buildFlowOriginContextBlock(context));
    }

    return slackSendMessage({
      token,
      text: text || undefined,
      username,
      profilePicture,
      iconEmoji,
      conversationId: channel,
      threadTs: threadTs ? processMessageTimestamp(threadTs) : undefined,
      file,
      blocks: blockList.length > 0 ? blockList : undefined,
      replyBroadcast,
      unfurlLinks,
    });
  },
});
