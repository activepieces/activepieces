import { createAction, Property } from '@activepieces/pieces-framework';
import { buildFlowOriginContextBlock, slackSendMessage, textToSectionBlocks } from '../common/utils';
import { slackAuth } from '../../';
import { assertNotNullOrUndefined } from '@activepieces/shared';
import {
  profilePicture,
  text,
  userId,
  username,
  blocks,
  mentionOriginFlow,
  iconEmoji,
} from '../common/props';
import { Block,KnownBlock } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';


export const slackSendDirectMessageAction = createAction({
  auth: slackAuth,
  name: 'send_direct_message',
  displayName: 'Send Message To A User',
  description: 'Send message to a user',
  props: {
    userId,
    text,
    username,
    profilePicture,
    iconEmoji,
    mentionOriginFlow,
    blocks,
    unfurlLinks: Property.Checkbox({
      displayName: 'Unfurl Links',
      description: 'Enable link unfurling for this message',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const token = getBotToken(context.auth as SlackAuthValue);
    const { text, userId, blocks, unfurlLinks, mentionOriginFlow } = context.propsValue;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(text, 'text');
    assertNotNullOrUndefined(userId, 'userId');

    const blockList: (KnownBlock | Block)[] = [...textToSectionBlocks(text)]

    if(blocks && Array.isArray(blocks)) {
      blockList.push(...(blocks as unknown as (KnownBlock | Block)[]))
    }

    if(mentionOriginFlow) {
      blockList.push(buildFlowOriginContextBlock(context));
    }

    return slackSendMessage({
      token,
      text,
      username: context.propsValue.username,
      profilePicture: context.propsValue.profilePicture,
      iconEmoji: context.propsValue.iconEmoji,
      conversationId: userId,
      blocks:blockList,
      unfurlLinks,
    });
  },
});

