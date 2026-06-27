import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { Block, KnownBlock, WebClient } from '@slack/web-api';
import { textToSectionBlocks } from '../common/utils';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const slackScheduleMessageAction = createAction({
  auth: slackAuth,
  name: 'slack_schedule_message',
  displayName: 'Schedule Message',
  description: 'Schedule a message to be sent to a channel at a future time.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Queue a message to be posted to a channel at a future Unix timestamp (post_at, in seconds, must be in the future and within 120 days). Pass a channel ID (e.g. C0123ABCD); resolve a #name with Find Channel. Returns a scheduled_message_id you can later cancel with Delete Scheduled Message or review with List Scheduled Messages. Use Post Message to send immediately. Each call queues a new send, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    channel: Property.ShortText({
      displayName: 'Channel',
      description:
        'Channel ID to post to (e.g. C0123ABCD). Resolve a #name with Find Channel.',
      required: true,
    }),
    postAt: Property.Number({
      displayName: 'Post At (Unix Seconds)',
      description:
        'Unix epoch timestamp in seconds for when to send, e.g. 1893456000. Must be in the future and within 120 days.',
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
        'Optional parent message ts to schedule this as a threaded reply, e.g. 1710304378.475129.',
      required: false,
    }),
    blocks: Property.Json({
      displayName: 'Block Kit Blocks',
      description:
        'Optional Block Kit blocks array. See https://api.slack.com/block-kit',
      required: false,
    }),
  },
  async run(context) {
    const { channel, postAt, text, threadTs, blocks } = context.propsValue;

    if (!text && (!blocks || !Array.isArray(blocks) || blocks.length === 0)) {
      throw new Error('Either Message or Block Kit blocks must be provided');
    }
    if (postAt <= Math.floor(Date.now() / 1000)) {
      throw new Error('Post At must be a Unix timestamp in the future.');
    }

    const client = new WebClient(getBotToken(context.auth as SlackAuthValue));

    const blockList: (KnownBlock | Block)[] = [];
    if (text) {
      blockList.push(...textToSectionBlocks(text));
    }
    if (blocks && Array.isArray(blocks) && blocks.length > 0) {
      blockList.push(...(blocks as unknown as (KnownBlock | Block)[]));
    }

    return await client.chat.scheduleMessage({
      channel,
      post_at: postAt,
      text: text || undefined,
      blocks: blockList,
      thread_ts: threadTs || undefined,
    });
  },
});
