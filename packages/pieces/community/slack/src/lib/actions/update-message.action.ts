import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { Block, KnownBlock, WebClient } from '@slack/web-api';
import { processMessageTimestamp, textToSectionBlocks } from '../common/utils';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const slackUpdateMessageAiAction = createAction({
  auth: slackAuth,
  name: 'slack_update_message',
  displayName: 'Update Message',
  description: 'Edit an existing Slack message in place.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Edit a previously posted message in place, replacing its text (and optionally blocks), identified by channel ID and message timestamp (ts). Obtain the ts from the result of Post Message, Search Messages, or Get Channel History. Use Delete Message to remove it instead. Idempotent: re-running with the same inputs leaves the message in the same final state.',
    idempotent: true,
  },
  props: {
    channel: Property.ShortText({
      displayName: 'Channel',
      description:
        'Channel ID containing the message (e.g. C0123ABCD). Resolve a #name with Find Channel.',
      required: true,
    }),
    ts: Property.ShortText({
      displayName: 'Message Timestamp',
      description:
        'Timestamp (ts) of the message to update, e.g. 1710304378.475129. Obtain it from Post Message / Search Messages / Get Channel History.',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Message',
      description: 'The new text of the message.',
      required: true,
    }),
    blocks: Property.Json({
      displayName: 'Block Kit Blocks',
      description:
        'Optional Block Kit blocks array to replace the message blocks. See https://api.slack.com/block-kit',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const messageTimestamp = processMessageTimestamp(propsValue.ts);
    if (!messageTimestamp) {
      throw new Error('Invalid Timestamp Value.');
    }
    const client = new WebClient(getBotToken(auth as SlackAuthValue));

    const blockList: (KnownBlock | Block)[] = [...textToSectionBlocks(propsValue.text)];
    if (propsValue.blocks && Array.isArray(propsValue.blocks) && propsValue.blocks.length > 0) {
      blockList.push(...(propsValue.blocks as unknown as (KnownBlock | Block)[]));
    }

    return await client.chat.update({
      channel: propsValue.channel,
      ts: messageTimestamp,
      text: propsValue.text,
      blocks: blockList,
    });
  },
});
