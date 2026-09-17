import { createAction, Property } from '@activepieces/pieces-framework';
import { buildFlowOriginContextBlock, slackSendMessage, textToSectionBlocks } from '../common/utils';
import { slackAuth } from '../auth';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import {
  profilePicture,
  userId,
  username,
  blocks,
  mentionOriginFlow,
  iconEmoji,
} from '../common/props';
import { Block,KnownBlock } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';
import { chatPostMessageOutputSchema } from '../output-schemas';


export const slackSendDirectMessageAction = createAction({
  auth: slackAuth,
  name: 'send_direct_message',
  classification: 'WRITE',
  displayName: 'Send Message To A User',
  description: 'Send message to a user',
  audience: 'human',
  aiMetadata: { description: 'Send a direct message to a single user by user ID, with optional Block Kit blocks, custom username/icon, and link unfurling. Each call posts a new DM, so it is not idempotent. Use this to message one person privately; use Send Message To A Channel to post in a channel.', idempotent: false },
  outputSchema: chatPostMessageOutputSchema,
  props: {
    userId: userId(true),
    text: Property.LongText({
      displayName: 'Message',
      description:
        'The text of your message. Renders as a section above any Block Kit blocks, and is used as the notification fallback. Leave empty to send blocks only.',
      required: false,
    }),
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
    assertNotNullOrUndefined(userId, 'userId');
    if (!text && (!blocks || !Array.isArray(blocks) || blocks.length === 0)) {
      throw new Error('Either Message or Block Kit blocks must be provided');
    }

    const blockList: (KnownBlock | Block)[] = [];
    if (text) {
      blockList.push(...textToSectionBlocks(text));
    }

    if(blocks && Array.isArray(blocks)) {
      blockList.push(...(blocks as unknown as (KnownBlock | Block)[]))
    }

    if(mentionOriginFlow) {
      blockList.push(buildFlowOriginContextBlock(context));
    }

    return slackSendMessage({
      token,
      text: text || undefined,
      username: context.propsValue.username,
      profilePicture: context.propsValue.profilePicture,
      iconEmoji: context.propsValue.iconEmoji,
      conversationId: userId,
      blocks:blockList,
      unfurlLinks,
    });
  },
});

