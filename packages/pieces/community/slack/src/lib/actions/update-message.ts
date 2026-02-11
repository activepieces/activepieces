import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../..';
import { blocks, singleSelectChannelInfo, slackChannel, mentionOriginFlow } from '../common/props';
import { buildFlowOriginContextBlock, processMessageTimestamp, textToSectionBlocks } from '../common/utils';
import { Block,KnownBlock, WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const updateMessage = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'updateMessage',
  displayName: 'Update message',
  description: 'Update an existing message',
  auth: slackAuth,
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
      description: 'The updated text of your message',
      required: true,
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

    const blockList: (KnownBlock | Block)[] = [...textToSectionBlocks(propsValue.text)];

    if (propsValue.blocks && Array.isArray(propsValue.blocks) && propsValue.blocks.length > 0) {
      blockList.push(...(propsValue.blocks as unknown as (KnownBlock | Block)[]));
    }

    if (propsValue.mentionOriginFlow) {
      blockList.push(buildFlowOriginContextBlock(context));
    }

    return await client.chat.update({
      channel: propsValue.channel,
      ts: messageTimestamp,
      text: propsValue.text,
      blocks: blockList,
    });
  },
});
