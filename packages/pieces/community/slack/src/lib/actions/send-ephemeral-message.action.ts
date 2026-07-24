import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { Block, KnownBlock, WebClient } from '@slack/web-api';
import { textToSectionBlocks } from '../common/utils';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const slackSendEphemeralMessageAction = createAction({
  auth: slackAuth,
  name: 'slack_send_ephemeral_message',
  displayName: 'Send Ephemeral Message',
  description:
    'Post a message visible only to one user within a channel.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Post an ephemeral message that is visible only to one specified user inside a channel and is not stored in the channel history. Pass a channel ID and the target user ID; the user must be a member of that channel and the bot must be in it. Use Post Message for a normal message everyone sees, or Send Direct Message for a private DM. Each call posts a new ephemeral message, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    channel: Property.ShortText({
      displayName: 'Channel',
      description:
        'Channel ID where the ephemeral message appears (e.g. C0123ABCD). Resolve a #name with Find Channel.',
      required: true,
    }),
    user: Property.ShortText({
      displayName: 'User ID',
      description:
        'The user ID who will see the message (e.g. U0123ABCD). Must be a member of the channel.',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Message',
      description:
        'The text of the message. When using blocks, this is used as fallback text for notifications.',
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
    const { channel, user, text, blocks } = context.propsValue;

    if (!text && (!blocks || !Array.isArray(blocks) || blocks.length === 0)) {
      throw new Error('Either Message or Block Kit blocks must be provided');
    }

    const client = new WebClient(getBotToken(context.auth as SlackAuthValue));

    const blockList: (KnownBlock | Block)[] = [];
    if (text) {
      blockList.push(...textToSectionBlocks(text));
    }
    if (blocks && Array.isArray(blocks) && blocks.length > 0) {
      blockList.push(...(blocks as unknown as (KnownBlock | Block)[]));
    }

    return await client.chat.postEphemeral({
      channel,
      user,
      text: text || undefined,
      blocks: blockList,
    });
  },
});
