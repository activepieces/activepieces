import { createAction, Property } from '@activepieces/pieces-framework';
import {
  autoAddBot,
  profilePicture,
  slackChannel,
  username,
  blocks,
  threadTs,
  singleSelectChannelInfo,
  mentionOriginFlow,
  iconEmoji,
} from '../common/props';
import { buildFlowOriginContextBlock, processMessageTimestamp, slackSendMessage, textToSectionBlocks, tryAddBotToChannel } from '../common/utils';
import { slackAuth } from '../auth';
import { Block, KnownBlock } from '@slack/web-api';
import { getBotToken, getUserToken, requireUserToken, SlackAuthValue } from '../common/auth-helpers';

export const slackSendMessageAction = createAction({
  auth: slackAuth,
  name: 'send_channel_message',
  displayName: 'Send Message To A Channel',
  description: 'Send message to a channel',
  props: {
    info: singleSelectChannelInfo,
    channel: slackChannel(true),
    autoAddBot,
    text: Property.LongText({
      displayName: 'Message',
      description: 'The text of your message. When using Block Kit blocks, this is used as a fallback for notifications.',
      required: false,
    }),
    sendAsBot: Property.Checkbox({
      displayName: 'Send as a bot?',
      required: true,
      defaultValue: true,
    }),
    threadTs,
    username,
    profilePicture,
    iconEmoji,
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
    const { text, channel, autoAddBot: shouldAddBot, sendAsBot, username, profilePicture, iconEmoji, threadTs, file, mentionOriginFlow, blocks, replyBroadcast, unfurlLinks } =
      context.propsValue;

    const botToken = getBotToken(context.auth as SlackAuthValue);
    const token = sendAsBot ? botToken : requireUserToken(context.auth as SlackAuthValue);

    if (shouldAddBot) {
      await tryAddBotToChannel({
        botToken,
        userToken: getUserToken(context.auth as SlackAuthValue),
        channel,
      });
    }

    if (!text && (!blocks || !Array.isArray(blocks) || blocks.length === 0)) {
      throw new Error('Either Message or Block Kit blocks must be provided');
    }

    const blockList: (KnownBlock | Block)[] = [];

    if (text) {
      blockList.push(...textToSectionBlocks(text));
    }

    if (blocks && Array.isArray(blocks) && blocks.length > 0) {
      blockList.push(...(blocks as unknown as (KnownBlock | Block)[]));
    }

    if (mentionOriginFlow) {
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
