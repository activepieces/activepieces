import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { blocks, singleSelectChannelInfo, slackChannel, mentionOriginFlow } from '../common/props';
import { buildFlowOriginContextBlock, processMessageTimestamp, textToSectionBlocks } from '../common/utils';
import { Block,KnownBlock, WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';
import { chatUpdateOutputSchema } from '../output-schemas';

export const updateMessage = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'updateMessage',
  classification: 'WRITE',
  displayName: 'Update message',
  description: 'Update an existing message',
  audience: 'human',
  aiMetadata: {
    description:
      'Edit an already-posted Slack message in place, replacing its text and blocks, identified by channel and message timestamp (ts). Pick this to revise content the flow previously sent rather than posting a new one; use Delete Message to remove it instead. Idempotent: re-running with the same inputs leaves the message in the same final state.',
    idempotent: true,
  },
  auth: slackAuth,
  outputSchema: chatUpdateOutputSchema,
  props: {
    info: singleSelectChannelInfo,
    channel: slackChannel(true),
    ts: Property.ShortText({
      displayName: 'Message Timestamp',
      description:
        'Please provide the timestamp of the message you wish to update, such as `1710304378.475129`. Alternatively, you can easily obtain the message link by clicking on the three dots next to the message and selecting the `Copy link` option.',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Message',
      description:
        'The updated text of the message. When Block Kit blocks are provided, this is used only as the notification fallback and is NOT rendered as a section (so it never duplicates your blocks).',
      required: false,
    }),
    mentionOriginFlow,
    blocks,
  },
  async run(context) {
    const { auth, propsValue } = context;
    const messageTimestamp = processMessageTimestamp(propsValue.ts);
    if (!messageTimestamp) {
      throw new Error('Invalid Timestamp Value.');
    }
    const client = new WebClient(getBotToken(auth as SlackAuthValue));

    const blockList: (KnownBlock | Block)[] = [];

    // Only render `text` as a section when it's actually provided. When the caller
    // supplies `blocks`, `text` is used solely as the notification fallback (standard
    // Slack semantics) instead of being duplicated as a section on top of the blocks —
    // matching the Send/Post Message action.
    if (propsValue.text) {
      blockList.push(...textToSectionBlocks(propsValue.text));
    }

    if (propsValue.blocks && Array.isArray(propsValue.blocks) && propsValue.blocks.length > 0) {
      blockList.push(...(propsValue.blocks as unknown as (KnownBlock | Block)[]));
    }

    if (propsValue.mentionOriginFlow) {
      blockList.push(buildFlowOriginContextBlock(context));
    }

    if (blockList.length === 0) {
      throw new Error('Provide a Message and/or Block Kit blocks to update.');
    }

    return await client.chat.update({
      channel: propsValue.channel,
      ts: messageTimestamp,
      text: propsValue.text || undefined,
      blocks: blockList,
    });
  },
});
