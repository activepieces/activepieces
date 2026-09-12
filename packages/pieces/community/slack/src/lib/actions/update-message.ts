import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { blocks, singleSelectChannelInfo, slackChannel, mentionOriginFlow } from '../common/props';
import { buildFlowOriginContextBlock, processMessageTimestamp, textToSectionBlocks } from '../common/utils';
import { Block,KnownBlock, WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';
import { chatUpdateOutputSchema } from '../output-schemas';

export const updateMessage = createAction({
  name: 'updateMessage',
  classification: 'WRITE',
  displayName: 'Update Message',
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
        'Timestamp of the target message, from its link or a trigger output.',
      placeholder: '1710304378.475129',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Message',
      description: 'Slack mrkdwn is supported. Empty updates blocks only.',
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

    if (propsValue.text) {
      blockList.push(...textToSectionBlocks(propsValue.text));
    }

    if (propsValue.blocks && Array.isArray(propsValue.blocks) && propsValue.blocks.length > 0) {
      blockList.push(...(propsValue.blocks as unknown as (KnownBlock | Block)[]));
    }

    if (blockList.length === 0) {
      throw new Error('Either Message or Block Kit blocks must be provided');
    }

    if (propsValue.mentionOriginFlow) {
      blockList.push(buildFlowOriginContextBlock(context));
    }

    return await client.chat.update({
      channel: propsValue.channel,
      ts: messageTimestamp,
      text: propsValue.text || undefined,
      blocks: blockList,
    });
  },
});
