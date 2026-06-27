import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { Block, KnownBlock } from '@slack/web-api';
import {
  processMessageTimestamp,
  slackSendMessage,
  textToSectionBlocks,
} from '../common/utils';
import {
  getBotToken,
  requireUserToken,
  SlackAuthValue,
} from '../common/auth-helpers';

export const slackPostMessageAction = createAction({
  auth: slackAuth,
  name: 'slack_post_message',
  displayName: 'Post Message',
  description: 'Post a message to a Slack channel.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Post a message to a channel, optionally as a threaded reply or with Block Kit blocks. Pass a channel ID (e.g. C0123ABCD); resolve a #name first with Find Channel. Use Send Direct Message to message one person privately, or Schedule Message to send at a future time. Each call posts a new message, so it is not idempotent; provide either text or blocks.',
    idempotent: false,
  },
  props: {
    channel: Property.ShortText({
      displayName: 'Channel',
      description:
        'Channel ID to post to (e.g. C0123ABCD). Resolve a #name to an ID first with Find Channel.',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Message',
      description:
        'The text of the message. When using blocks, this is used as fallback text for notifications.',
      required: false,
    }),
    threadTs: Property.ShortText({
      displayName: 'Thread Timestamp',
      description:
        'Timestamp (ts) of a parent message to reply within its thread, e.g. 1710304378.475129. Use the parent ts, not a reply ts.',
      required: false,
    }),
    replyBroadcast: Property.Checkbox({
      displayName: 'Broadcast Reply to Channel',
      description:
        'When replying in a thread, also make the reply visible to everyone in the channel.',
      required: false,
      defaultValue: false,
    }),
    sendAsUser: Property.Checkbox({
      displayName: 'Send as User',
      description:
        'Post as the authenticated user instead of the bot (requires a user token).',
      required: false,
      defaultValue: false,
    }),
    unfurlLinks: Property.Checkbox({
      displayName: 'Unfurl Links',
      description: 'Enable link unfurling for this message.',
      required: false,
      defaultValue: true,
    }),
    blocks: Property.Json({
      displayName: 'Block Kit Blocks',
      description:
        'Optional Block Kit blocks array. See https://api.slack.com/block-kit',
      required: false,
    }),
  },
  async run(context) {
    const { channel, text, threadTs, replyBroadcast, sendAsUser, unfurlLinks, blocks } =
      context.propsValue;

    const token = sendAsUser
      ? requireUserToken(context.auth as SlackAuthValue)
      : getBotToken(context.auth as SlackAuthValue);

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

    return slackSendMessage({
      token,
      text: text || undefined,
      conversationId: channel,
      threadTs: threadTs ? processMessageTimestamp(threadTs) : undefined,
      blocks: blockList.length > 0 ? blockList : undefined,
      replyBroadcast,
      unfurlLinks,
    });
  },
});
