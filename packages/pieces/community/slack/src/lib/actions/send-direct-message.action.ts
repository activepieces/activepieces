import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { Block, KnownBlock } from '@slack/web-api';
import { slackSendMessage, textToSectionBlocks } from '../common/utils';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const slackSendDirectMessageAiAction = createAction({
  auth: slackAuth,
  name: 'slack_send_direct_message',
  displayName: 'Send Direct Message',
  description: 'Send a direct message (DM) to a single Slack user.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Open a DM with one user (by user ID, e.g. U0123ABCD) and post a message to them privately, optionally with Block Kit blocks. Resolve a handle or email to a user ID first with Find User by Email or Find User by Handle. Use Post Message to send to a channel instead. Each call posts a new DM, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    userId: Property.ShortText({
      displayName: 'User ID',
      description:
        'The Slack user ID to DM (e.g. U0123ABCD). Resolve a handle/email to an ID first with Find User by Handle / Find User by Email.',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Message',
      description: 'The text of the direct message.',
      required: true,
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
    const token = getBotToken(context.auth as SlackAuthValue);
    const { text, userId, blocks, unfurlLinks } = context.propsValue;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(text, 'text');
    assertNotNullOrUndefined(userId, 'userId');

    const blockList: (KnownBlock | Block)[] = [...textToSectionBlocks(text)];
    if (blocks && Array.isArray(blocks)) {
      blockList.push(...(blocks as unknown as (KnownBlock | Block)[]));
    }

    return slackSendMessage({
      token,
      text,
      conversationId: userId,
      blocks: blockList,
      unfurlLinks,
    });
  },
});
